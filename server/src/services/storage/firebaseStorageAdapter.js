import { admin } from '../../config/firebaseAdmin.js';

/**
 * Firebase Cloud Storage Adapter
 * Manages private object storage using Firebase Admin SDK (Google Cloud Storage)
 */
export class FirebaseStorageAdapter {
  constructor(options = {}) {
    this.bucketName = options.bucket || process.env.FIREBASE_STORAGE_BUCKET || 'apporbit-e635d.firebasestorage.app';
    this.provider = 'firebase';
  }

  _getBucket() {
    return admin.storage().bucket(this.bucketName);
  }

  /**
   * Upload APK binary directly to Firebase Cloud Storage bucket
   */
  async uploadApk({ key, buffer, stream, contentType }) {
    const bucket = this._getBucket();
    const file = bucket.file(key);

    const options = {
      metadata: { contentType: contentType || 'application/vnd.android.package-archive' },
      resumable: false // Prevent permission issues with resumable upload sessions
    };

    if (buffer) {
      await file.save(buffer, options);
    } else if (stream) {
      await new Promise((resolve, reject) => {
        stream.pipe(file.createWriteStream(options))
          .on('error', reject)
          .on('finish', resolve);
      });
    } else {
      throw new Error('uploadApk requires either buffer or stream');
    }

    return {
      key,
      storageProvider: this.provider,
      storagePath: `gs://${this.bucketName}/${key}`,
      contentType: contentType || 'application/vnd.android.package-archive',
    };
  }

  /**
   * Read APK file buffer from Firebase
   */
  async getApkBuffer({ key }) {
    const bucket = this._getBucket();
    const file = bucket.file(key);
    const [buffer] = await file.download();
    return buffer;
  }

  /**
   * Get readable stream from Firebase
   */
  getApkStream({ key }) {
    const bucket = this._getBucket();
    return bucket.file(key).createReadStream();
  }

  /**
   * Delete APK object from Firebase
   */
  async deleteApk({ key }) {
    try {
      const bucket = this._getBucket();
      await bucket.file(key).delete();
      return { success: true, key };
    } catch (err) {
      console.error(`[FirebaseStorage] Failed to delete key: ${key}`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Generates Firebase Cloud Storage presigned URL for downloading
   */
  async generateDownloadUrl({ key, expiresIn = 900, filename = 'app.apk' }) {
    const bucket = this._getBucket();
    const file = bucket.file(key);
    
    const sanitizedFilename = encodeURIComponent(filename);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + (expiresIn * 1000),
      responseDisposition: `attachment; filename="${sanitizedFilename}"`
    });

    return url;
  }

  /**
   * Generates Firebase Cloud Storage presigned URL for direct client uploads
   */
  async generateUploadUrl({ key, expiresIn = 900, contentType = 'application/vnd.android.package-archive' }) {
    const bucket = this._getBucket();
    const file = bucket.file(key);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + (expiresIn * 1000),
      contentType
    });

    return url;
  }
}
