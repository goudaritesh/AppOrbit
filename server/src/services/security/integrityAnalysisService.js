import crypto from 'crypto';

/**
 * Integrity Analysis Service (Phase 6 Production Implementation)
 * Recalculates cryptographic SHA-256 hash from storage bytes and verifies
 * binary consistency against the upload registration digest.
 */
export class IntegrityAnalysisService {
  /**
   * Verify buffer integrity against expected hash
   * @param {Buffer} buffer - Stored APK binary buffer
   * @param {string} expectedHash - Authoritative registration hash
   * @returns {Object} Integrity result
   */
  static verifyIntegrity(buffer, expectedHash) {
    if (!buffer || buffer.length === 0) {
      return {
        status: 'FAILED',
        match: false,
        originalHash: (expectedHash || '').toLowerCase(),
        verifiedHash: '',
        algorithm: 'SHA-256',
        error: 'Buffer is empty or corrupted',
      };
    }

    try {
      const calculatedHash = crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();
      const normalizedExpected = (expectedHash || '').trim().toLowerCase();

      const match = Boolean(normalizedExpected && calculatedHash === normalizedExpected);

      return {
        status: match ? 'VALID' : 'MISMATCH',
        match,
        originalHash: normalizedExpected,
        verifiedHash: calculatedHash,
        algorithm: 'SHA-256',
        fileSize: buffer.length,
      };
    } catch (err) {
      return {
        status: 'FAILED',
        match: false,
        originalHash: (expectedHash || '').toLowerCase(),
        verifiedHash: '',
        algorithm: 'SHA-256',
        error: err.message,
      };
    }
  }
}

export default IntegrityAnalysisService;
