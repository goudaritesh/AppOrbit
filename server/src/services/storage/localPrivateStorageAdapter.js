import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Local Private Storage Adapter
 * Stores APK binary artifacts strictly outside public web roots.
 * Generates cryptographically signed, short-lived URLs with HMAC integrity.
 */
export class LocalPrivateStorageAdapter {
  constructor(options = {}) {
    const rawPath = options.storagePath || process.env.STORAGE_LOCAL_PATH || 'storage/private/apks';
    this.baseDirectory = path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(__dirname, '../../../../server', rawPath);

    this.signingSecret = process.env.JWT_SECRET || 'apporbit_local_storage_fallback_secret_key_12345';
    this.provider = 'local-private';

    // Ensure root storage directory exists
    if (!fs.existsSync(this.baseDirectory)) {
      fs.mkdirSync(this.baseDirectory, { recursive: true });
    }
  }

  /**
   * Resolves safe absolute path on disk and guards against path traversal
   */
  _resolvePath(key) {
    const sanitizedKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(this.baseDirectory, sanitizedKey);

    // Guard against path traversal breakout
    if (!fullPath.startsWith(this.baseDirectory)) {
      throw new Error(`Path traversal attempt detected for storage key: ${key}`);
    }

    return fullPath;
  }

  /**
   * Persist APK binary to isolated private directory
   */
  async uploadApk({ key, buffer, stream, contentType }) {
    const targetPath = this._resolvePath(key);
    const parentDir = path.dirname(targetPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    if (buffer) {
      await fs.promises.writeFile(targetPath, buffer);
    } else if (stream) {
      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(targetPath);
        stream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } else {
      throw new Error('Either buffer or stream must be provided for upload');
    }

    const stats = await fs.promises.stat(targetPath);

    return {
      key,
      storageProvider: this.provider,
      storagePath: targetPath,
      size: stats.size,
      contentType: contentType || 'application/vnd.android.package-archive',
    };
  }

  /**
   * Read APK file buffer from private storage
   */
  async getApkBuffer({ key }) {
    const targetPath = this._resolvePath(key);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`APK file not found in storage: ${key}`);
    }
    return await fs.promises.readFile(targetPath);
  }

  /**
   * Create readable stream of stored APK
   */
  getApkStream({ key }) {
    const targetPath = this._resolvePath(key);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`APK file not found in storage: ${key}`);
    }
    return fs.createReadStream(targetPath);
  }

  /**
   * Delete APK file from disk
   */
  async deleteApk({ key }) {
    try {
      const targetPath = this._resolvePath(key);
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
      }
      return { success: true, key };
    } catch (err) {
      console.error(`[Storage] Failed to delete APK file: ${key}`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Generates a cryptographically signed HMAC download URL
   */
  async generateDownloadUrl({ key, expiresIn = 900, filename = 'app.apk', appId, versionId }) {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    const sanitizedFilename = encodeURIComponent(path.basename(filename));

    const payload = `${key}|${expiresAt}|${sanitizedFilename}`;
    const token = crypto
      .createHmac('sha256', this.signingSecret)
      .update(payload)
      .digest('hex');

    const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/developer/apps/${appId}/versions/${versionId}/download?key=${encodeURIComponent(
      key
    )}&expires=${expiresAt}&filename=${sanitizedFilename}&token=${token}`;
  }

  /**
   * Verify HMAC signature and expiration timestamp for download request
   */
  verifyDownloadToken({ key, expires, filename, token }) {
    if (!key || !expires || !token) return false;

    const now = Math.floor(Date.now() / 1000);
    if (parseInt(expires, 10) < now) {
      return false; // Expired
    }

    const payload = `${key}|${expires}|${filename}`;
    const expected = crypto
      .createHmac('sha256', this.signingSecret)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}

export default LocalPrivateStorageAdapter;
