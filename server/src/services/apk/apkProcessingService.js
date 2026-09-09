import { AppVersion } from '../../models/AppVersion.js';
import { App } from '../../models/App.js';
import { storageService } from '../storage/storageService.js';
import { ApkValidationService } from './apkValidationService.js';
import { ApkHashService } from './apkHashService.js';
import { ApkMetadataService } from './apkMetadataService.js';
import { securityScanQueue } from '../../workers/securityScanQueue.js';

/**
 * APK Processing Pipeline Service
 * Coordinates validation, binary hashing, manifest extraction, consistency checks,
 * and lifecycle status transitions.
 */
export class ApkProcessingService {
  /**
   * Process an uploaded APK version artifact
   */
  static async processVersion(versionId) {
    const version = await AppVersion.findById(versionId);
    if (!version) {
      throw new Error(`AppVersion not found: ${versionId}`);
    }

    // Set status to PROCESSING
    version.processingStatus = 'PROCESSING';
    version.processingError = null;
    await version.save();

    try {
      // 1. Retrieve binary from private storage
      const buffer = await storageService.getApkBuffer({ key: version.storageKey });
      if (!buffer || buffer.length === 0) {
        throw new Error('Retrieved APK storage object is empty or corrupted');
      }

      // 2. Perform multi-layered safety & structure validation
      const validationResult = ApkValidationService.validateAll({
        filename: version.originalFileName,
        fileSize: buffer.length,
        mimeType: version.contentType,
        buffer,
      });

      if (!validationResult.valid) {
        return await this._recordFailure(
          version,
          'INVALID_APK_STRUCTURE',
          validationResult.error || 'APK structural validation failed'
        );
      }

      // 3. Authoritative binary hashing (SHA-256)
      const calculatedHash = ApkHashService.hashBuffer(buffer);
      version.fileHash = calculatedHash;
      version.fileSize = buffer.length;

      // 4. Extract APK metadata & permissions
      let metadata;
      try {
        metadata = await ApkMetadataService.extractMetadata(buffer);
      } catch (extractErr) {
        return await this._recordFailure(
          version,
          'METADATA_EXTRACTION_FAILED',
          extractErr.message || 'Failed to extract Android manifest metadata'
        );
      }

      // 5. Query parent application to enforce consistency rules
      const app = await App.findById(version.app);
      if (!app) {
        return await this._recordFailure(version, 'APP_NOT_FOUND', 'Parent application not found');
      }

      // Package Name Consistency Rule:
      // An established application's package name cannot change across releases
      if (app.packageName && app.packageName !== metadata.packageName) {
        return await this._recordFailure(
          version,
          'PACKAGE_NAME_MISMATCH',
          `APK package name (${metadata.packageName}) does not match application package identity (${app.packageName})`
        );
      }

      // Duplicate Version Code Rule:
      const existingWithCode = await AppVersion.findOne({
        app: version.app,
        versionCode: metadata.versionCode,
        _id: { $ne: version._id },
        processingStatus: 'COMPLETED',
        uploadStatus: { $ne: 'DELETED' },
      });

      if (existingWithCode) {
        return await this._recordFailure(
          version,
          'DUPLICATE_VERSION_CODE',
          `Version code ${metadata.versionCode} has already been registered for this application`
        );
      }

      // 6. Persist extracted and validated metadata
      version.packageName = metadata.packageName;
      version.versionCode = metadata.versionCode;
      if (!version.versionName || version.versionName === '0.0.0') {
        version.versionName = metadata.versionName;
      }
      version.minSdkVersion = metadata.minSdkVersion;
      version.targetSdkVersion = metadata.targetSdkVersion;
      version.applicationLabel = metadata.applicationLabel;
      version.permissions = metadata.permissions;
      version.certificateInfo = metadata.certificateInfo;

      version.uploadStatus = 'UPLOADED';
      version.processingStatus = 'COMPLETED';
      version.securityStatus = 'PENDING_SCAN'; // Prepared for Phase 6
      version.downloadStatus = 'DISABLED'; // Controlled: downloads disabled until Phase 6 security passes
      version.metadataExtractedAt = new Date();

      await version.save();

      // Ensure application has packageName established
      if (!app.packageName) {
        app.packageName = metadata.packageName;
        await app.save();
      }

      // Enqueue automated security analysis (Phase 6)
      if (process.env.SECURITY_SCAN_ENABLED !== 'false') {
        try {
          await securityScanQueue.addJob({ versionId: version._id });
        } catch (queueErr) {
          console.error('[ApkProcessingService] Failed to enqueue security scan job:', queueErr);
        }
      }

      return {
        success: true,
        version,
      };
    } catch (err) {
      console.error(`[ApkProcessingService] Unexpected error processing version ${versionId}:`, err);
      return await this._recordFailure(version, 'PROCESSING_ERROR', err.message);
    }
  }

  /**
   * Helper to safely persist processing failures
   */
  static async _recordFailure(version, code, message) {
    version.processingStatus = 'FAILED';
    version.uploadStatus = 'FAILED';
    version.processingError = {
      code,
      message,
      occurredAt: new Date(),
    };
    await version.save();

    return {
      success: false,
      error: { code, message },
      version,
    };
  }
}

export default ApkProcessingService;
