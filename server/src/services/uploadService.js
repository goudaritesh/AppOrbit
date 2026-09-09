import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root uploads directory: server/storage/uploads
const UPLOADS_ROOT = path.resolve(__dirname, '../../../server/storage/uploads');

class UploadService {
  constructor() {
    this.uploadsRoot = UPLOADS_ROOT;
    this._ensureDirectories();
  }

  _ensureDirectories() {
    const dirs = [
      path.join(this.uploadsRoot, 'app-icons'),
      path.join(this.uploadsRoot, 'screenshots'),
      path.join(this.uploadsRoot, 'demo-videos'),
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Saves a media buffer to disk in an isolated application subfolder
   */
  async saveMediaFile({ appId, folder, buffer, originalName }) {
    if (!buffer) {
      throw new Error('File buffer is required to persist media');
    }

    const ext = (path.extname(originalName || '').toLowerCase() || '.png');
    const safeExt = ext.replace(/[^a-z0-9.]/gi, '');
    const uniqueId = crypto.randomUUID();
    const fileName = `${uniqueId}${safeExt}`;

    const appDir = path.join(this.uploadsRoot, folder, appId.toString());
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    const filePath = path.join(appDir, fileName);
    await fs.promises.writeFile(filePath, buffer);

    // Return the relative web URL served by Express static
    return `/uploads/${folder}/${appId}/${fileName}`;
  }

  /**
   * Deletes a media file from disk by relative or absolute URL
   */
  async deleteMediaFile(fileUrl) {
    if (!fileUrl || typeof fileUrl !== 'string') return false;

    // Only process URLs that belong to /uploads/
    if (!fileUrl.includes('/uploads/')) return false;

    const relativePath = fileUrl.split('/uploads/')[1];
    if (!relativePath) return false;

    const fullPath = path.normalize(path.join(this.uploadsRoot, relativePath));

    // Guard against path traversal
    if (!fullPath.startsWith(this.uploadsRoot)) {
      console.warn(`[UploadService] Path traversal attempt blocked: ${fileUrl}`);
      return false;
    }

    try {
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
    } catch (err) {
      console.error(`[UploadService] Failed to delete file ${fullPath}:`, err.message);
    }
    return false;
  }

  async saveAppIcon(appId, file) {
    return await this.saveMediaFile({
      appId,
      folder: 'app-icons',
      buffer: file.buffer,
      originalName: file.originalname,
    });
  }

  async saveScreenshot(appId, file) {
    return await this.saveMediaFile({
      appId,
      folder: 'screenshots',
      buffer: file.buffer,
      originalName: file.originalname,
    });
  }

  async saveDemoVideo(appId, file) {
    return await this.saveMediaFile({
      appId,
      folder: 'demo-videos',
      buffer: file.buffer,
      originalName: file.originalname,
    });
  }
}

export const uploadService = new UploadService();
export default uploadService;
