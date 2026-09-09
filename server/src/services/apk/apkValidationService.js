import AdmZip from 'adm-zip';

/**
 * Multi-Layered APK Validation Service
 * Guards against malicious payloads, disguised binaries, zip-bombs, and path traversal attacks.
 */
export class ApkValidationService {
  /**
   * Validate filename extension (Layer 1)
   */
  static validateExtension(filename) {
    if (!filename || typeof filename !== 'string') {
      return { valid: false, error: 'Filename is required' };
    }
    const isApk = filename.toLowerCase().endsWith('.apk');
    if (!isApk) {
      return { valid: false, error: 'File must have a .apk extension' };
    }
    return { valid: true };
  }

  /**
   * Validate file size against configured limits (Layer 2)
   */
  static validateFileSize(bytes) {
    const maxMb = parseInt(process.env.MAX_APK_SIZE_MB, 10) || 200;
    const maxBytes = maxMb * 1024 * 1024;

    if (!bytes || bytes <= 0) {
      return { valid: false, error: 'File is empty (0 bytes)' };
    }
    if (bytes > maxBytes) {
      return {
        valid: false,
        error: `File size exceeds the platform maximum limit of ${maxMb} MB`,
      };
    }
    return { valid: true };
  }

  /**
   * Validate MIME type (Layer 3)
   */
  static validateMimeType(mimeType) {
    const allowed = [
      'application/vnd.android.package-archive',
      'application/octet-stream',
      'application/zip',
      'application/x-zip-compressed',
    ];
    if (mimeType && !allowed.includes(mimeType.toLowerCase())) {
      return { valid: false, error: `Disallowed MIME type: ${mimeType}` };
    }
    return { valid: true };
  }

  /**
   * Verify ZIP magic bytes signature: PK\x03\x04 (Layer 4)
   */
  static validateMagicBytes(buffer) {
    if (!buffer || buffer.length < 4) {
      return { valid: false, error: 'Invalid or truncated binary header' };
    }

    // Standard ZIP Local File Header magic bytes: 0x50, 0x4B, 0x03, 0x04
    const isZip =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;

    if (!isZip) {
      return {
        valid: false,
        error: 'Binary header signature mismatch: not a valid ZIP/APK archive',
      };
    }

    return { valid: true };
  }

  /**
   * Inspect ZIP archive structure & guard against zip-bombs and path traversal (Layer 5 & 6)
   */
  static inspectArchive(buffer) {
    let zip;
    try {
      zip = new AdmZip(buffer);
    } catch (err) {
      return {
        valid: false,
        error: `Corrupted or malformed archive: ${err.message}`,
      };
    }

    let zipEntries;
    try {
      zipEntries = zip.getEntries();
    } catch (err) {
      return {
        valid: false,
        error: `Failed to read archive entry table: ${err.message}`,
      };
    }

    if (!zipEntries || zipEntries.length === 0) {
      return { valid: false, error: 'APK archive contains zero entries' };
    }

    // Safety checks
    const MAX_ENTRIES = 25000;
    const MAX_UNPACKED_BYTES = 500 * 1024 * 1024; // 500 MB
    const MAX_RATIO = 100; // 100:1 compression ratio limit

    if (zipEntries.length > MAX_ENTRIES) {
      return {
        valid: false,
        error: `Archive contains too many entries (${zipEntries.length} > ${MAX_ENTRIES})`,
      };
    }

    let totalUncompressedSize = 0;
    let totalCompressedSize = 0;
    let hasManifest = false;
    let hasClassesDex = false;

    for (const entry of zipEntries) {
      const entryName = entry.entryName;

      // Path traversal check
      if (
        entryName.includes('..') ||
        entryName.startsWith('/') ||
        entryName.startsWith('\\') ||
        /^[a-zA-Z]:/.test(entryName)
      ) {
        return {
          valid: false,
          error: `Unsafe path traversal entry detected: ${entryName}`,
        };
      }

      totalUncompressedSize += entry.header.size || 0;
      totalCompressedSize += entry.header.compressedSize || 0;

      // Required APK structural members
      if (entryName === 'AndroidManifest.xml') {
        hasManifest = true;
      }
      if (entryName === 'classes.dex' || entryName.startsWith('classes') && entryName.endsWith('.dex')) {
        hasClassesDex = true;
      }
    }

    // Check for Zip-Bomb conditions
    if (totalUncompressedSize > MAX_UNPACKED_BYTES) {
      return {
        valid: false,
        error: `Total uncompressed size exceeds safety ceiling of 500 MB (Zip Bomb defense)`,
      };
    }

    if (totalCompressedSize > 0) {
      const ratio = totalUncompressedSize / totalCompressedSize;
      if (ratio > MAX_RATIO) {
        return {
          valid: false,
          error: `Excessive compression ratio of ${ratio.toFixed(1)}:1 exceeds safety threshold (Zip Bomb defense)`,
        };
      }
    }

    // APK Structural validation: AndroidManifest.xml is strictly required
    if (!hasManifest) {
      return {
        valid: false,
        error: 'Invalid APK structure: missing AndroidManifest.xml',
      };
    }

    return {
      valid: true,
      entryCount: zipEntries.length,
      uncompressedSize: totalUncompressedSize,
      hasManifest,
      hasClassesDex,
    };
  }

  /**
   * Run all multi-layered validation stages on an incoming APK upload
   */
  static validateAll({ filename, fileSize, mimeType, buffer }) {
    const extCheck = this.validateExtension(filename);
    if (!extCheck.valid) return extCheck;

    const sizeCheck = this.validateFileSize(fileSize);
    if (!sizeCheck.valid) return sizeCheck;

    if (mimeType) {
      const mimeCheck = this.validateMimeType(mimeType);
      if (!mimeCheck.valid) return mimeCheck;
    }

    if (buffer) {
      const magicCheck = this.validateMagicBytes(buffer);
      if (!magicCheck.valid) return magicCheck;

      const archiveCheck = this.inspectArchive(buffer);
      if (!archiveCheck.valid) return archiveCheck;

      return {
        valid: true,
        archiveInfo: archiveCheck,
      };
    }

    return { valid: true };
  }
}

export default ApkValidationService;
