import crypto from 'crypto';
import path from 'path';
import { LocalPrivateStorageAdapter } from './localPrivateStorageAdapter.js';
import { S3StorageAdapter } from './s3StorageAdapter.js';
import { FirebaseStorageAdapter } from './firebaseStorageAdapter.js';

/**
 * Storage Service Factory
 * Isolates controllers from cloud storage implementations.
 */
class StorageService {
  constructor() {
    this.providerType = process.env.STORAGE_PROVIDER || 'local-private';

    if (this.providerType === 's3' || this.providerType === 'r2') {
      this.adapter = new S3StorageAdapter({ provider: this.providerType });
    } else if (this.providerType === 'firebase') {
      this.adapter = new FirebaseStorageAdapter();
    } else {
      this.adapter = new LocalPrivateStorageAdapter();
    }
  }

  /**
   * Deterministically generates a secure, randomized storage key
   * Uses state (temporary, verified, quarantine) as the root folder
   */
  generateStorageKey(developerId, appId, versionId, originalName = 'app.apk', state = 'temporary') {
    const randomId = crypto.randomUUID();
    const sanitizedExt = path.extname(originalName).toLowerCase() || '.apk';
    return `${state}/${appId}/${versionId}/${randomId}${sanitizedExt}`;
  }

  /**
   * Uploads an APK binary into private storage
   */
  async uploadApk(params) {
    return await this.adapter.uploadApk(params);
  }

  /**
   * Reads raw APK buffer from private storage
   */
  async getApkBuffer(params) {
    return await this.adapter.getApkBuffer(params);
  }

  /**
   * Opens readable stream from private storage
   */
  getApkStream(params) {
    return this.adapter.getApkStream(params);
  }

  /**
   * Deletes APK binary from storage
   */
  async deleteApk(params) {
    return await this.adapter.deleteApk(params);
  }

  /**
   * Moves APK binary between lifecycle states (e.g., temporary -> verified)
   */
  async moveApk(params) {
    if (this.adapter.moveApk) {
      return await this.adapter.moveApk(params);
    }
    // Fallback for S3 if move is not implemented, copy then delete
    throw new Error('moveApk not implemented on adapter');
  }

  /**
   * Generates a short-lived download URL (valid for 15 minutes by default)
   */
  async generateDownloadUrl(params) {
    return await this.adapter.generateDownloadUrl(params);
  }

  /**
   * Generates direct upload URL if supported
   */
  async generateUploadUrl(params) {
    if (this.adapter.generateUploadUrl) {
      return await this.adapter.generateUploadUrl(params);
    }
    return null;
  }

  /**
   * Verifies signed token for local-private storage streams
   */
  verifyDownloadToken(params) {
    if (this.adapter.verifyDownloadToken) {
      return this.adapter.verifyDownloadToken(params);
    }
    return false;
  }
}

export const storageService = new StorageService();
export default storageService;
