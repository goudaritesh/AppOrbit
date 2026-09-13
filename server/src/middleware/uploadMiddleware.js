import multer from 'multer';
import os from 'os';
import crypto from 'crypto';
import { FILE_LIMITS } from './fileValidation.js';

// Use MemoryStorage so that buffers can be inspected for magic bytes and security hashes
const storage = multer.memoryStorage();

// 1. Icon upload configuration (5MB ceiling)
const iconMulter = multer({
  storage,
  limits: { fileSize: FILE_LIMITS.ICON_MAX_BYTES },
});

// 2. Screenshot upload configuration (10MB per file, max 10 files)
const screenshotsMulter = multer({
  storage,
  limits: { fileSize: FILE_LIMITS.SCREENSHOT_MAX_BYTES },
});

// 3. Demo Video upload configuration (100MB ceiling)
const videoMulter = multer({
  storage,
  limits: { fileSize: FILE_LIMITS.VIDEO_MAX_BYTES },
});

// 4. APK upload configuration (200MB ceiling)
// Uses diskStorage to prevent Out-Of-Memory (OOM) crashes on large files
const apkMulter = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => cb(null, `apk-upload-${crypto.randomUUID()}-${file.originalname}`)
  }),
  limits: { fileSize: FILE_LIMITS.APK_MAX_BYTES },
});

/**
 * Flexible wrapper that accepts either standard field name or fallback
 */
export const uploadIcon = (req, res, next) => {
  const handler = iconMulter.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);
  handler(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: 'Icon exceeds the maximum allowed size of 5 MB',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    // Normalize to req.file
    req.file = req.files?.icon?.[0] || req.files?.file?.[0] || null;
    next();
  });
};

export const uploadScreenshots = (req, res, next) => {
  const handler = screenshotsMulter.fields([
    { name: 'screenshots', maxCount: 10 },
    { name: 'screenshot', maxCount: 10 },
    { name: 'files', maxCount: 10 },
  ]);
  handler(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: 'One or more screenshots exceed the maximum allowed size of 10 MB',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    // Normalize to req.files array
    req.filesList = [
      ...(req.files?.screenshots || []),
      ...(req.files?.screenshot || []),
      ...(req.files?.files || []),
    ];
    next();
  });
};

export const uploadDemoVideo = (req, res, next) => {
  const handler = videoMulter.fields([
    { name: 'video', maxCount: 1 },
    { name: 'demoVideo', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);
  handler(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: 'Video exceeds the maximum allowed size of 100 MB',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    req.file = req.files?.video?.[0] || req.files?.demoVideo?.[0] || req.files?.file?.[0] || null;
    next();
  });
};

export const uploadApk = (req, res, next) => {
  const handler = apkMulter.fields([
    { name: 'apk', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);
  handler(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: 'APK binary exceeds the maximum platform limit of 200 MB',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    req.file = req.files?.apk?.[0] || req.files?.file?.[0] || null;
    next();
  });
};
