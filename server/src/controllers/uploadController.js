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
import { apkQueue } from '../workers/apkQueue.js';
import fs from 'fs';

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

    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FILE',
        message: 'APK binary is required (field: "apk" or "file")',
      });
    }

    const { originalname, size, mimetype, path: tempFilePath } = req.file;

    // 1. Layered APK validation
    const extCheck = ApkValidationService.validateExtension(originalname);
    if (!extCheck.valid) {
      fs.unlink(tempFilePath, () => {});
      return res.status(400).json({ success: false, code: 'INVALID_EXTENSION', message: extCheck.error });
    }

    const sizeCheck = ApkValidationService.validateFileSize(size);
    if (!sizeCheck.valid) {
      fs.unlink(tempFilePath, () => {});
      return res.status(400).json({ success: false, code: 'FILE_TOO_LARGE', message: sizeCheck.error });
    }

    const mimeCheck = ApkValidationService.validateMimeType(mimetype);
    if (!mimeCheck.valid) {
      fs.unlink(tempFilePath, () => {});
      return res.status(400).json({ success: false, code: 'INVALID_MIME_TYPE', message: mimeCheck.error });
    }

    // BYPASS ALL SYNCHRONOUS HEAVY PARSING TO PREVENT RENDER 100-SECOND LOAD BALANCER TIMEOUTS
    // The background apkProcessingService will perform inspectArchive, fileHash, scanRes, and extractMetadata!

    // Save binary directly to quarantine storage
    const versionId = crypto.randomUUID();
    const quarantineKey = storageService.generateStorageKey(
      req.user._id.toString(),
      app._id.toString(),
      versionId,
      originalname,
      'quarantine'
    );

    let uploadResult;
    try {
      uploadResult = await storageService.uploadApk({
        key: quarantineKey,
        stream: fs.createReadStream(tempFilePath),
        contentType: 'application/vnd.android.package-archive',
      });
    } finally {
      fs.unlink(tempFilePath, () => {}); // Always clean up temporary file
    }

    // Save version metadata in MongoDB with PROCESSING status
    const versionName = req.body?.versionName || req.body?.version || app.version || '1.0.0';
    const versionCode = req.body?.versionCode ? parseInt(req.body.versionCode, 10) : 1;

    const versionDoc = await AppVersion.create({
      app: app._id,
      developer: req.user._id,
      versionName,
      versionCode,
      releaseNotes: req.body?.releaseNotes || 'Uploaded via Sprint 4 Security Pipeline',
      fileName: path.basename(quarantineKey),
      originalFileName: originalname,
      fileSize: size,
      fileHash: 'PENDING_BACKGROUND_HASH', // Placeholder until ApkProcessingService computes it
      sha256: 'PENDING_BACKGROUND_HASH',
      storageProvider: uploadResult.storageProvider,
      storageKey: quarantineKey,
      storagePath: uploadResult.storagePath,
      contentType: uploadResult.contentType,
      uploadStatus: 'UPLOADED',
      processingStatus: 'PROCESSING',
      securityStatus: 'PENDING_SCAN',
      downloadStatus: 'DISABLED',
      quarantined: true,
      quarantineReason: 'Awaiting background processing and security verification',
      quarantinedAt: new Date(),
      quarantinedStorageKey: quarantineKey,
      isCurrent: true,
    });

    // Update application record
    app.currentVersion = versionDoc._id;
    app.version = versionName;
    await app.save();

    // Enqueue background processing
    await apkQueue.addJob({ versionId: versionDoc._id });

    return res.status(201).json({
      success: true,
      message: 'APK uploaded successfully. Background validation and processing has started.',
      data: versionDoc,
      version: versionDoc,
      apk: {
        fileName: originalname,
        version: versionName,
        versionCode,
        storageKey: quarantineKey,
        size,
        quarantined: true,
        securityStatus: versionDoc.securityStatus,
        downloadStatus: versionDoc.downloadStatus,
        uploadedAt: new Date(),
        apkMetadata: {
          versionName,
          versionCode,
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

/**
 * POST /api/v1/apps/:id/apk/upload-url
 * Generate a direct-to-cloud presigned URL to bypass the Render 100-second timeout.
 */
export const generateApkUploadUrl = async (req, res, next) => {
  try {
    const app = await resolveAppWithOwnership(req);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const { fileName, fileSize, contentType, versionName, versionCode, releaseNotes } = req.body;
    if (!fileName || !fileSize) {
      return res.status(400).json({ success: false, message: 'fileName and fileSize are required' });
    }

    const versionId = crypto.randomUUID();
    const quarantineKey = storageService.generateStorageKey(
      req.user._id.toString(),
      app._id.toString(),
      versionId,
      fileName,
      'quarantine'
    );

    const uploadUrl = await storageService.adapter.generateUploadUrl({
      key: quarantineKey,
      expiresIn: 3600, // 1 hour to upload
      contentType: contentType || 'application/vnd.android.package-archive',
    });

    // Create placeholder AppVersion so the frontend can confirm it later
    const versionDoc = await AppVersion.create({
      app: app._id,
      developer: req.user._id,
      versionName: versionName || app.version || '1.0.0',
      versionCode: versionCode ? parseInt(versionCode, 10) : 1,
      releaseNotes: releaseNotes || 'Uploaded via Direct-to-Cloud Pipeline',
      fileName: path.basename(quarantineKey),
      originalFileName: fileName,
      fileSize,
      fileHash: 'PENDING_UPLOAD',
      sha256: 'PENDING_UPLOAD',
      storageProvider: storageService.providerType,
      storageKey: quarantineKey,
      storagePath: `direct://${quarantineKey}`,
      contentType: contentType || 'application/vnd.android.package-archive',
      uploadStatus: 'UPLOADING',
      processingStatus: 'IDLE',
      securityStatus: 'PENDING_SCAN',
      downloadStatus: 'DISABLED',
      quarantined: true,
      quarantineReason: 'Awaiting direct client upload completion',
      quarantinedAt: new Date(),
      quarantinedStorageKey: quarantineKey,
      isCurrent: true,
    });

    // Update application record
    app.currentVersion = versionDoc._id;
    app.version = versionDoc.versionName;
    await app.save();

    return res.status(200).json({
      success: true,
      uploadUrl,
      versionId: versionDoc._id,
      storageKey: quarantineKey,
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: err.message });
    }
    next(err);
  }
};

/**
 * POST /api/v1/apps/:id/apk/confirm
 * Confirm that a Direct-to-Cloud upload finished, and trigger the background processing.
 */
export const confirmApkUpload = async (req, res, next) => {
  try {
    const app = await resolveAppWithOwnership(req);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const { versionId } = req.body;
    if (!versionId) {
      return res.status(400).json({ success: false, message: 'versionId is required' });
    }

    const versionDoc = await AppVersion.findOne({ _id: versionId, app: app._id });
    if (!versionDoc) {
      return res.status(404).json({ success: false, message: 'Version record not found' });
    }

    // Set the placeholder hashes back to the background worker format so Validation doesn't fail
    versionDoc.uploadStatus = 'UPLOADED';
    versionDoc.processingStatus = 'PROCESSING';
    versionDoc.quarantineReason = 'Awaiting background processing and security verification';
    versionDoc.fileHash = 'PENDING_BACKGROUND_HASH';
    versionDoc.sha256 = 'PENDING_BACKGROUND_HASH';
    await versionDoc.save();

    // Enqueue background processing
    await apkQueue.addJob({ versionId: versionDoc._id });

    return res.status(200).json({
      success: true,
      message: 'Upload confirmed successfully. Background processing has started.',
      data: versionDoc,
      apk: {
        fileName: versionDoc.originalFileName,
        version: versionDoc.versionName,
        versionCode: versionDoc.versionCode,
        storageKey: versionDoc.storageKey,
        size: versionDoc.fileSize,
        quarantined: true,
        securityStatus: versionDoc.securityStatus,
        downloadStatus: versionDoc.downloadStatus,
        uploadedAt: new Date(),
        apkMetadata: {
          versionName: versionDoc.versionName,
          versionCode: versionDoc.versionCode,
        },
      }
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: err.message });
    }
    next(err);
  }
};
