import crypto from 'crypto';
import path from 'path';
import App from '../models/App.js';
import AppVersion from '../models/AppVersion.js';
import { uploadService } from '../services/uploadService.js';
import {
  FILE_LIMITS,
  validateImageFile,
  validateVideoFile,
} from '../middleware/fileValidation.js';
import { ApkValidationService } from '../services/apk/apkValidationService.js';
import { ApkMetadataService } from '../services/apk/apkMetadataService.js';
import { ApkHashService } from '../services/apk/apkHashService.js';
import { storageService } from '../services/storage/storageService.js';
import { ApkSecurityPipeline } from '../security/apkSecurityPipeline.js';

/**
 * Resolves target application document and checks ownership
 */
const resolveAppWithOwnership = async (req) => {
  if (req.app) return req.app;

  const appId = req.params.id || req.params.appId;
  if (!appId) return null;

  const app = await App.findById(appId);
  if (!app) return null;

  // Verify ownership unless superadmin/admin
  const isOwner = app.developer?.toString() === req.user?._id?.toString();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role);
  if (!isOwner && !isAdmin) {
    const err = new Error('You do not have permission to modify this application');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  return app;
};

/**
 * POST /api/v1/apps/:id/icon
 * Upload and set application icon (PNG/JPG/WEBP <= 5MB)
 */
export const uploadAppIcon = async (req, res, next) => {
  try {
    const app = await resolveAppWithOwnership(req);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FILE',
        message: 'No icon file provided in request (field: "icon" or "file")',
      });
    }

    // Multi-layer validation (Extension, Size, MIME, Magic Bytes)
    const validation = validateImageFile(req.file, FILE_LIMITS.ICON_MAX_BYTES);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        code: validation.code,
        message: validation.message,
      });
    }

    // Remove previous icon file if local
    if (app.icon && app.icon.startsWith('/uploads/')) {
      await uploadService.deleteMediaFile(app.icon);
    }

    // Persist new icon
    const iconUrl = await uploadService.saveAppIcon(app._id, req.file);
    app.icon = iconUrl;
    await app.save();

    return res.status(200).json({
      success: true,
      message: 'App icon uploaded successfully',
      icon: iconUrl,
      app: {
        _id: app._id,
        name: app.name,
        icon: iconUrl,
      },
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: err.message });
    }
    next(err);
  }
};

/**
 * POST /api/v1/apps/:id/screenshots
 * Upload up to 10 application screenshots (PNG/JPG/WEBP <= 10MB each)
 */
export const uploadScreenshots = async (req, res, next) => {
  try {
    const app = await resolveAppWithOwnership(req);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const files = req.filesList || (req.files ? Object.values(req.files).flat() : []) || [];
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FILES',
        message: 'No screenshot files uploaded',
      });
    }

    const currentCount = app.screenshots?.length || 0;
    if (currentCount + files.length > FILE_LIMITS.MAX_SCREENSHOTS_COUNT) {
      return res.status(400).json({
        success: false,
        code: 'SCREENSHOT_LIMIT_EXCEEDED',
        message: `Cannot exceed maximum limit of ${FILE_LIMITS.MAX_SCREENSHOTS_COUNT} screenshots. Current: ${currentCount}, Uploading: ${files.length}`,
      });
    }

    // Validate each file
    for (const file of files) {
      const validation = validateImageFile(file, FILE_LIMITS.SCREENSHOT_MAX_BYTES);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          code: validation.code,
          message: `File "${file.originalname}": ${validation.message}`,
        });
      }
    }

    // Persist files and append to screenshots list
    const newScreenshots = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await uploadService.saveScreenshot(app._id, file);
      const shotItem = {
        url,
        alt: file.originalname,
        order: currentCount + i,
      };
      app.screenshots.push(shotItem);
      newScreenshots.push(shotItem);
    }

    await app.save();

    return res.status(201).json({
      success: true,
      message: `${files.length} screenshot(s) uploaded successfully`,
      screenshots: app.screenshots,
      uploaded: newScreenshots,
      count: app.screenshots.length,
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: err.message });
    }
    next(err);
  }
};

/**
 * POST /api/v1/apps/:id/demo-video
 * Upload application demo video (MP4/WEBM <= 100MB)
 */
export const uploadDemoVideo = async (req, res, next) => {
  try {
    const app = await resolveAppWithOwnership(req);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FILE',
        message: 'No video file provided (field: "video" or "demoVideo")',
      });
    }

    const validation = validateVideoFile(req.file, FILE_LIMITS.VIDEO_MAX_BYTES);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        code: validation.code,
        message: validation.message,
      });
    }

    // Remove previous demo video if local
    if (app.demoVideo?.url && app.demoVideo.url.startsWith('/uploads/')) {
      await uploadService.deleteMediaFile(app.demoVideo.url);
    }

    const videoUrl = await uploadService.saveDemoVideo(app._id, req.file);
    app.demoVideo = {
      type: 'direct',
      url: videoUrl,
      provider: 'direct',
    };
    await app.save();

    return res.status(200).json({
      success: true,
      message: 'Demo video uploaded successfully',
      demoVideo: app.demoVideo,
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: err.message });
    }
    next(err);
  }
};

/**
 * POST /api/v1/apps/:id/apk
 * Direct APK binary upload with validation, metadata extraction, SHA-256 hash, and private storage
 */
export const uploadAppApk = async (req, res, next) => {
  try {
    const app = await resolveAppWithOwnership(req);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FILE',
        message: 'APK binary is required (field: "apk" or "file")',
      });
    }

    const { originalname, size, mimetype, buffer } = req.file;

    // 1. Layered APK validation
    const extCheck = ApkValidationService.validateExtension(originalname);
    if (!extCheck.valid) {
      return res.status(400).json({ success: false, code: 'INVALID_EXTENSION', message: extCheck.error });
    }

    const sizeCheck = ApkValidationService.validateFileSize(size);
    if (!sizeCheck.valid) {
      return res.status(400).json({ success: false, code: 'FILE_TOO_LARGE', message: sizeCheck.error });
    }

    const mimeCheck = ApkValidationService.validateMimeType(mimetype);
    if (!mimeCheck.valid) {
      return res.status(400).json({ success: false, code: 'INVALID_MIME_TYPE', message: mimeCheck.error });
    }

    const magicCheck = ApkValidationService.validateMagicBytes(buffer);
    if (!magicCheck.valid) {
      return res.status(400).json({ success: false, code: 'MAGIC_BYTES_MISMATCH', message: magicCheck.error });
    }

    const archiveCheck = ApkValidationService.inspectArchive(buffer);
    if (!archiveCheck.valid) {
      return res.status(400).json({ success: false, code: 'INVALID_ARCHIVE', message: archiveCheck.error });
    }

    // 2. Cryptographic SHA-256 binary hash
    const fileHash = ApkHashService.hashBuffer(buffer);

    // Sprint 4: Layer 2 & 3 Security scan & signature analysis
    const scanRes = ApkSecurityPipeline.scanApkBuffer(buffer);
    const sigInfo = ApkSecurityPipeline.extractSignatureInfo(buffer);

    // 3. Extract APK AndroidManifest metadata
    let metadata = {};
    try {
      metadata = await ApkMetadataService.extractMetadata(buffer);
    } catch (metaErr) {
      console.warn('[uploadAppApk] Non-fatal metadata extraction warning:', metaErr.message);
    }

    // 4. Save binary to private storage
    const versionId = crypto.randomUUID();
    const storageKey = storageService.generateStorageKey(
      req.user._id.toString(),
      app._id.toString(),
      versionId,
      originalname
    );

    const uploadResult = await storageService.uploadApk({
      key: storageKey,
      buffer,
      contentType: 'application/vnd.android.package-archive',
    });

    // Sprint 4: Move into isolated quarantine storage
    const quarantineInfo = await ApkSecurityPipeline.moveToQuarantine(
      app._id,
      versionId,
      uploadResult.storagePath
    );

    // 5. Save version metadata in MongoDB
    const versionName = metadata?.versionName || req.body?.versionName || req.body?.version || app.version || '1.0.0';
    const versionCode = metadata?.versionCode || (req.body?.versionCode ? parseInt(req.body.versionCode, 10) : 1);

    const versionDoc = await AppVersion.create({
      app: app._id,
      developer: req.user._id,
      versionName,
      versionCode,
      releaseNotes: req.body?.releaseNotes || 'Uploaded via Sprint 4 Security Pipeline',
      fileName: path.basename(quarantineInfo.storageKey || storageKey),
      originalFileName: originalname,
      fileSize: size,
      fileHash,
      sha256: fileHash,
      storageProvider: uploadResult.storageProvider,
      storageKey: quarantineInfo.storageKey || storageKey,
      storagePath: quarantineInfo.storagePath || uploadResult.storagePath,
      contentType: uploadResult.contentType,
      uploadStatus: 'UPLOADED',
      processingStatus: 'COMPLETED',
      securityStatus: scanRes.scanStatus === 'SCAN_PASSED' ? 'PASSED' : 'SUSPICIOUS',
      downloadStatus: 'DISABLED', // Unscanned/Quarantined APK != Public Download!
      quarantined: true,
      quarantineReason: 'Awaiting administrative verification and approval',
      quarantinedAt: new Date(),
      quarantinedStorageKey: quarantineInfo.storageKey,
      certificateInfo: sigInfo,
      signatureStatus: sigInfo.verified ? 'VALID' : 'INVALID',
      isCurrent: true,
      apkMetadata: metadata,
    });

    // Update application record
    app.currentVersion = versionDoc._id;
    app.version = versionName;
    if (metadata?.packageName) {
      app.packageName = metadata.packageName;
    }
    await app.save();

    return res.status(201).json({
      success: true,
      message: 'APK uploaded, validated, and placed in secure quarantine for review',
      data: versionDoc,
      version: versionDoc,
      apk: {
        fileName: originalname,
        version: versionName,
        versionCode,
        storageKey: quarantineInfo.storageKey || storageKey,
        size,
        sha256: fileHash,
        quarantined: true,
        securityStatus: versionDoc.securityStatus,
        downloadStatus: versionDoc.downloadStatus,
        uploadedAt: new Date(),
        apkMetadata: {
          packageName: metadata?.packageName || '',
          versionName,
          versionCode,
          minSdkVersion: metadata?.minSdkVersion || 21,
          targetSdkVersion: metadata?.targetSdkVersion || 34,
        },
      },
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: err.message });
    }
    next(err);
  }
};

/**
 * DELETE /api/v1/apps/:id/screenshots/:screenshotId
 * Remove a specific screenshot from the application
 */
export const deleteScreenshot = async (req, res, next) => {
  try {
    const app = await resolveAppWithOwnership(req);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const { screenshotId } = req.params;
    const targetIdx = app.screenshots.findIndex((s) => {
      const matchId = s._id && s._id.toString() === screenshotId;
      const matchUrl = s.url && (s.url.includes(screenshotId) || s.url === screenshotId);
      return matchId || matchUrl;
    });

    if (targetIdx === -1) {
      return res.status(404).json({
        success: false,
        message: 'Screenshot not found on this application',
      });
    }

    const [removed] = app.screenshots.splice(targetIdx, 1);
    if (removed && removed.url && removed.url.startsWith('/uploads/')) {
      await uploadService.deleteMediaFile(removed.url);
    }

    await app.save();

    return res.status(200).json({
      success: true,
      message: 'Screenshot deleted successfully',
      screenshots: app.screenshots,
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: err.message });
    }
    next(err);
  }
};

/**
 * DELETE /api/v1/apps/:id/media/:mediaId
 * Delete specified media asset (icon, demo-video, or screenshot)
 */
export const deleteMedia = async (req, res, next) => {
  try {
    const app = await resolveAppWithOwnership(req);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const { mediaId } = req.params;
    if (mediaId === 'icon') {
      if (app.icon && app.icon.startsWith('/uploads/')) {
        await uploadService.deleteMediaFile(app.icon);
      }
      app.icon = '';
      await app.save();
      return res.status(200).json({ success: true, message: 'App icon removed successfully' });
    }

    if (mediaId === 'demo-video' || mediaId === 'video') {
      if (app.demoVideo?.url && app.demoVideo.url.startsWith('/uploads/')) {
        await uploadService.deleteMediaFile(app.demoVideo.url);
      }
      app.demoVideo = { type: 'youtube', url: '', provider: 'youtube' };
      await app.save();
      return res.status(200).json({ success: true, message: 'Demo video removed successfully' });
    }

    // Treat as screenshotId
    req.params.screenshotId = mediaId;
    return deleteScreenshot(req, res, next);
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: err.message });
    }
    next(err);
  }
};
