import path from 'path';
import crypto from 'crypto';
import { AppVersion } from '../models/AppVersion.js';
import { App } from '../models/App.js';
import { UploadSession } from '../models/UploadSession.js';
import { storageService } from '../services/storage/storageService.js';
import { ApkValidationService } from '../services/apk/apkValidationService.js';
import { ApkHashService } from '../services/apk/apkHashService.js';
import { apkQueue } from '../workers/apkQueue.js';
import { serializeDeveloperVersion, serializeDeveloperVersionList } from '../utils/versionSerializer.js';
import { DownloadEligibilityService } from '../services/security/downloadEligibilityService.js';

/**
 * Developer Version Management Controller
 * Enforces strict application ownership and secure APK version lifecycles.
 */

/**
 * POST /api/developer/apps/:appId/versions/upload-init
 * Initialize an upload session and generate pre-upload parameters
 */
export const initializeUploadSession = async (req, res, next) => {
  try {
    const { originalFileName, fileSize, expectedHash } = req.body;

    const validation = ApkValidationService.validateExtension(originalFileName);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    if (fileSize) {
      const sizeValidation = ApkValidationService.validateFileSize(fileSize);
      if (!sizeValidation.valid) {
        return res.status(400).json({ success: false, message: sizeValidation.error });
      }
    }

    const versionTempId = new crypto.randomUUID();
    const storageKey = storageService.generateStorageKey(
      req.user._id.toString(),
      req.app._id.toString(),
      versionTempId,
      originalFileName
    );

    const expirySeconds = parseInt(process.env.UPLOAD_URL_EXPIRY_SECONDS, 10) || 900;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    const session = await UploadSession.create({
      developer: req.user._id,
      app: req.app._id,
      storageKey,
      originalFileName,
      fileSize: fileSize || 0,
      expectedHash: expectedHash || '',
      status: 'INITIALIZED',
      expiresAt,
    });

    const directUploadUrl = await storageService.generateUploadUrl({
      key: storageKey,
      expiresIn: expirySeconds,
    });

    return res.status(200).json({
      success: true,
      message: 'Upload session initialized successfully',
      data: {
        sessionId: session._id,
        storageKey,
        directUploadUrl,
        expiresAt,
        provider: storageService.providerType,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/developer/apps/:appId/versions/upload
 * Accept multipart APK binary upload, save to private storage, and queue processing
 */
export const uploadApkDirect = async (req, res, next) => {
  try {
    // Phase 7: Account suspension and feature restriction checks
    if (req.user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        code: 'DEVELOPER_SUSPENDED',
        message: 'Your developer account has been suspended. Please contact platform support.',
      });
    }

    if (req.user.restrictedFeatures?.includes('UPLOAD_APK')) {
      return res.status(403).json({
        success: false,
        code: 'FEATURE_RESTRICTED',
        message: 'APK upload privileges are restricted on your account.',
      });
    }

    if (req.app.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        code: 'APP_BLOCKED',
        message: 'This application has been blocked by platform administration. New uploads are forbidden.',
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'APK binary file is required in multipart form data (field: "apk")',
      });
    }

    const { originalname, size, mimetype, buffer } = req.file;

    // 1. Initial layer validation (Extension, Size, Magic Bytes)
    const extCheck = ApkValidationService.validateExtension(originalname);
    if (!extCheck.valid) {
      return res.status(400).json({ success: false, message: extCheck.error });
    }

    const sizeCheck = ApkValidationService.validateFileSize(size);
    if (!sizeCheck.valid) {
      return res.status(400).json({ success: false, message: sizeCheck.error });
    }

    const magicCheck = ApkValidationService.validateMagicBytes(buffer);
    if (!magicCheck.valid) {
      return res.status(400).json({ success: false, message: magicCheck.error });
    }

    // 2. Pre-inspect archive structure (guarantee not a fake zip or zip bomb)
    const archiveCheck = ApkValidationService.inspectArchive(buffer);
    if (!archiveCheck.valid) {
      return res.status(400).json({ success: false, message: archiveCheck.error });
    }

    // 3. Compute initial file hash
    const fileHash = ApkHashService.hashBuffer(buffer);

    // 4. Generate private storage key & upload
    const versionId = new crypto.randomUUID();
    const storageKey = storageService.generateStorageKey(
      req.user._id.toString(),
      req.app._id.toString(),
      versionId,
      originalname
    );

    const uploadResult = await storageService.uploadApk({
      key: storageKey,
      buffer,
      contentType: 'application/vnd.android.package-archive',
    });

    // 5. Create AppVersion record in PENDING state
    const versionName = (req.body.versionName || '').trim() || '0.0.0';
    const releaseNotes = (req.body.releaseNotes || '').trim();

    const versionDoc = await AppVersion.create({
      app: req.app._id,
      developer: req.user._id,
      versionName,
      versionCode: req.body.versionCode ? parseInt(req.body.versionCode, 10) : 0,
      releaseNotes,
      fileName: path.basename(storageKey),
      originalFileName: originalname,
      fileSize: size,
      fileHash,
      storageProvider: uploadResult.storageProvider,
      storageKey,
      storagePath: uploadResult.storagePath,
      contentType: uploadResult.contentType,
      uploadStatus: 'UPLOADED',
      processingStatus: 'PENDING',
      securityStatus: 'PENDING_SCAN',
      downloadStatus: 'DISABLED',
      isCurrent: false,
    });

    // 6. Queue background processing (or process synchronously if ?sync=true for test suites)
    if (req.query.sync === 'true' || process.env.NODE_ENV === 'test') {
      await apkQueue.processDirect(versionDoc._id);
    } else {
      await apkQueue.addJob({ versionId: versionDoc._id });
    }

    // Reload latest state after queuing/processing
    const updatedVersion = await AppVersion.findById(versionDoc._id);

    return res.status(201).json({
      success: true,
      message: 'APK uploaded successfully and queued for verification',
      data: {
        version: serializeDeveloperVersion(updatedVersion),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/developer/apps/:appId/versions
 * Retrieve version history for the specified application
 */
export const getVersions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {
      app: req.app._id,
      uploadStatus: { $ne: 'DELETED' },
    };

    const [versions, total] = await Promise.all([
      AppVersion.find(filter)
        .sort({ versionCode: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AppVersion.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        versions: serializeDeveloperVersionList(versions),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/developer/apps/:appId/versions/:versionId
 * Retrieve one version artifact
 */
export const getVersion = async (req, res, next) => {
  try {
    const version = await AppVersion.findOne({
      _id: req.params.versionId,
      app: req.app._id,
      uploadStatus: { $ne: 'DELETED' },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Application version not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        version: serializeDeveloperVersion(version),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/developer/apps/:appId/versions/:versionId
 * Update allowed metadata (e.g. release notes)
 */
export const updateVersion = async (req, res, next) => {
  try {
    const version = await AppVersion.findOne({
      _id: req.params.versionId,
      app: req.app._id,
      uploadStatus: { $ne: 'DELETED' },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Application version not found',
      });
    }

    if (req.body.releaseNotes !== undefined) {
      version.releaseNotes = String(req.body.releaseNotes).trim();
    }

    if (req.body.versionName !== undefined && req.body.versionName.trim()) {
      version.versionName = String(req.body.versionName).trim();
    }

    await version.save();

    return res.status(200).json({
      success: true,
      message: 'Version metadata updated successfully',
      data: {
        version: serializeDeveloperVersion(version),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/developer/apps/:appId/versions/:versionId/set-current
 * Atomically designate a version as the active release candidate
 */
export const setCurrentVersion = async (req, res, next) => {
  try {
    const version = await AppVersion.findOne({
      _id: req.params.versionId,
      app: req.app._id,
      uploadStatus: { $ne: 'DELETED' },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Application version not found',
      });
    }

    if (version.processingStatus !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Cannot set version as current candidate while processing status is ${version.processingStatus}`,
      });
    }

    // Coordinated update: clear previous current version, set this one to current
    await AppVersion.updateMany(
      { app: req.app._id, _id: { $ne: version._id } },
      { $set: { isCurrent: false } }
    );

    version.isCurrent = true;
    await version.save();

    // Update parent application currentVersion pointer
    req.app.currentVersion = version._id;
    await req.app.save();

    return res.status(200).json({
      success: true,
      message: `Version ${version.versionName} (build ${version.versionCode}) set as current candidate`,
      data: {
        version: serializeDeveloperVersion(version),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/developer/apps/:appId/versions/:versionId
 * Delete a draft or non-current version artifact and cleanup storage
 */
export const deleteVersion = async (req, res, next) => {
  try {
    const version = await AppVersion.findOne({
      _id: req.params.versionId,
      app: req.app._id,
      uploadStatus: { $ne: 'DELETED' },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Application version not found',
      });
    }

    // Guard: Cannot delete active current candidate
    if (version.isCurrent) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the active current version. Please select a different version first.',
      });
    }

    // Guard: Cannot delete while actively processing
    if (version.processingStatus === 'PROCESSING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a version while APK background processing is in progress',
      });
    }

    // Delete storage binary first
    await storageService.deleteApk({ key: version.storageKey });

    // Mark as DELETED or remove document
    await AppVersion.findByIdAndDelete(version._id);

    return res.status(200).json({
      success: true,
      message: 'Application version and storage artifact deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/developer/apps/:appId/versions/:versionId/download-url
 * Generate short-lived signed download URL for developer inspection
 */
export const getDownloadUrl = async (req, res, next) => {
  try {
    const version = await AppVersion.findOne({
      _id: req.params.versionId,
      app: req.app._id,
      uploadStatus: { $ne: 'DELETED' },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Application version not found',
      });
    }

    // Phase 6 & 7: Verify download eligibility (blocks quarantined, malicious, blocked app/version, mismatch)
    const eligibility = DownloadEligibilityService.isDeveloperDownloadEligible(version, req.app);
    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        code: eligibility.code,
        message: eligibility.reason,
      });
    }

    const expiresIn = parseInt(process.env.DOWNLOAD_URL_EXPIRY_SECONDS, 10) || 900;
    const downloadUrl = await storageService.generateDownloadUrl({
      key: version.storageKey,
      expiresIn,
      filename: `${req.app.slug}-v${version.versionName}.apk`,
      appId: req.app._id.toString(),
      versionId: version._id.toString(),
    });

    return res.status(200).json({
      success: true,
      data: {
        downloadUrl,
        expiresIn,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/developer/apps/:appId/versions/:versionId/download
 * Streaming download handler for local-private storage with token verification
 */
export const downloadStream = async (req, res, next) => {
  try {
    const { key, expires, filename, token } = req.query;

    if (token) {
      const isValid = storageService.verifyDownloadToken({ key, expires, filename, token });
      if (!isValid) {
        return res.status(403).json({
          success: false,
          message: 'Download token is invalid or has expired',
        });
      }
    }

    const appId = req.app?._id || req.params.appId;
    const version = await AppVersion.findOne({
      _id: req.params.versionId,
      app: appId,
      storageKey: key,
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Requested APK version not found',
      });
    }

    // Phase 6 & 7: Verify download eligibility
    const appDoc = req.app || (await App.findById(appId));
    const eligibility = DownloadEligibilityService.isDeveloperDownloadEligible(version, appDoc);
    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        code: eligibility.code,
        message: eligibility.reason,
      });
    }

    const safeFilename = filename || `${version.fileName || 'app'}.apk`;

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);

    const stream = storageService.getApkStream({ key });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export default {
  initializeUploadSession,
  uploadApkDirect,
  getVersions,
  getVersion,
  updateVersion,
  setCurrentVersion,
  deleteVersion,
  getDownloadUrl,
  downloadStream,
};
