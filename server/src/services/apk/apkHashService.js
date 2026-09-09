import crypto from 'crypto';

/**
 * APK Hashing Service
 * Calculates authoritative cryptographic SHA-256 binary digests.
 */
export class ApkHashService {
  /**
   * Calculate SHA-256 hex string from binary Buffer
   */
  static hashBuffer(buffer) {
    if (!buffer) {
      throw new Error('Buffer is required to calculate file hash');
    }
    return crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();
  }

  /**
   * Calculate SHA-256 hex string from readable Stream
   */
  static async hashStream(stream) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex').toLowerCase()));
      stream.on('error', reject);
    });
  }
}

export default ApkHashService;
