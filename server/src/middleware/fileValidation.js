import path from 'path';

/**
 * File Validation Utility & Middleware
 * Multi-layer defense-in-depth:
 * 1. File Size Verification
 * 2. File Extension Whitelist
 * 3. MIME-Type Inspection
 * 4. Magic Bytes Binary Signature Verification
 */

export const FILE_LIMITS = {
  ICON_MAX_BYTES: 5 * 1024 * 1024, // 5 MB
  SCREENSHOT_MAX_BYTES: 10 * 1024 * 1024, // 10 MB
  VIDEO_MAX_BYTES: 100 * 1024 * 1024, // 100 MB
  APK_MAX_BYTES: 200 * 1024 * 1024, // 200 MB
  MAX_SCREENSHOTS_COUNT: 10,
};

/**
 * Validates magic byte signatures from raw buffers
 */
export const validateMagicBytes = (buffer, expectedType) => {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  // PNG: 89 50 4E 47
  if (expectedType === 'image/png' || expectedType === 'png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  // JPEG / JPG: FF D8 FF
  if (expectedType === 'image/jpeg' || expectedType === 'jpeg' || expectedType === 'jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // WEBP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (expectedType === 'image/webp' || expectedType === 'webp') {
    if (buffer.length < 12) return false;
    const isRiff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // General Image check (PNG, JPEG, or WEBP)
  if (expectedType === 'image') {
    return (
      validateMagicBytes(buffer, 'png') ||
      validateMagicBytes(buffer, 'jpeg') ||
      validateMagicBytes(buffer, 'webp')
    );
  }

  // MP4: bytes 4-7 contain "ftyp" (0x66, 0x74, 0x79, 0x70)
  if (expectedType === 'video/mp4' || expectedType === 'mp4') {
    if (buffer.length < 8) return false;
    return (
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70
    );
  }

  // WEBM: 1A 45 DF A3 (EBML Header)
  if (expectedType === 'video/webm' || expectedType === 'webm') {
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  // General Video check (MP4 or WEBM)
  if (expectedType === 'video') {
    return validateMagicBytes(buffer, 'mp4') || validateMagicBytes(buffer, 'webm');
  }

  // APK: ZIP magic bytes 50 4B 03 04
  if (expectedType === 'apk' || expectedType === 'application/vnd.android.package-archive') {
    return (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    );
  }

  return false;
};

/**
 * Validates a single image file object
 */
export const validateImageFile = (file, maxBytes = FILE_LIMITS.ICON_MAX_BYTES) => {
  if (!file) {
    return { valid: false, code: 'MISSING_FILE', message: 'No file provided' };
  }

  const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      code: 'INVALID_EXTENSION',
      message: `Invalid file extension "${ext}". Allowed extensions: ${allowedExts.join(', ')}`,
    };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      code: 'FILE_TOO_LARGE',
      message: `File size exceeds the ${maxMb}MB maximum limit`,
    };
  }

  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (file.mimetype && !allowedMimes.includes(file.mimetype.toLowerCase())) {
    return {
      valid: false,
      code: 'INVALID_MIME_TYPE',
      message: `Invalid MIME type "${file.mimetype}". Allowed: ${allowedMimes.join(', ')}`,
    };
  }

  if (file.buffer && !validateMagicBytes(file.buffer, 'image')) {
    return {
      valid: false,
      code: 'MAGIC_BYTES_MISMATCH',
      message: 'File content does not match genuine image binary signature (PNG/JPEG/WEBP)',
    };
  }

  return { valid: true };
};

/**
 * Validates a video file object
 */
export const validateVideoFile = (file, maxBytes = FILE_LIMITS.VIDEO_MAX_BYTES) => {
  if (!file) {
    return { valid: false, code: 'MISSING_FILE', message: 'No video file provided' };
  }

  const allowedExts = ['.mp4', '.webm'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      code: 'INVALID_EXTENSION',
      message: `Invalid video extension "${ext}". Allowed: ${allowedExts.join(', ')}`,
    };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      code: 'FILE_TOO_LARGE',
      message: `Video size exceeds the ${maxMb}MB maximum limit`,
    };
  }

  const allowedMimes = ['video/mp4', 'video/webm'];
  if (file.mimetype && !allowedMimes.includes(file.mimetype.toLowerCase())) {
    return {
      valid: false,
      code: 'INVALID_MIME_TYPE',
      message: `Invalid video MIME type "${file.mimetype}". Allowed: ${allowedMimes.join(', ')}`,
    };
  }

  if (file.buffer && !validateMagicBytes(file.buffer, 'video')) {
    return {
      valid: false,
      code: 'MAGIC_BYTES_MISMATCH',
      message: 'File content does not match genuine video binary signature (MP4/WEBM)',
    };
  }

  return { valid: true };
};
