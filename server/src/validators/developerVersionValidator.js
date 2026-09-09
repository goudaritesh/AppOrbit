import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Middleware: format validation errors into a standardized response
 */
export const validateVersionRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for version request',
      errors: errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
      })),
    });
  }
  next();
};

/**
 * Security: Strip client attempts to inject backend-controlled version fields
 */
export const stripRestrictedVersionFields = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const restrictedFields = [
      'storageKey',
      'storageProvider',
      'storagePath',
      'fileHash',
      'hashAlgorithm',
      'developer',
      'app',
      'securityStatus',
      'downloadStatus',
      'isCurrent',
      'packageName',
      'versionCode',
      'minSdkVersion',
      'targetSdkVersion',
      'permissions',
      'certificateInfo',
      'processingStatus',
      'uploadStatus',
      'processingError',
    ];

    restrictedFields.forEach((field) => {
      delete req.body[field];
    });
  }
  next();
};

/**
 * Validator: Upload Session Initialization
 */
export const initUploadValidation = [
  body('originalFileName')
    .trim()
    .notEmpty()
    .withMessage('Original file name is required')
    .custom((val) => {
      if (!val.toLowerCase().endsWith('.apk')) {
        throw new Error('Filename must end with .apk extension');
      }
      return true;
    }),
  body('fileSize')
    .optional()
    .isInt({ min: 1 })
    .withMessage('File size must be a positive integer in bytes'),
  validateVersionRequest,
];

/**
 * Validator: Update Version Release Notes & Display Name
 */
export const updateVersionValidation = [
  param('versionId').custom((val) => {
    if (!mongoose.Types.ObjectId.isValid(val)) {
      throw new Error('Invalid version identifier');
    }
    return true;
  }),
  body('versionName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Version name cannot be blank')
    .isLength({ max: 50 })
    .withMessage('Version name cannot exceed 50 characters'),
  body('releaseNotes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Release notes cannot exceed 5,000 characters'),
  validateVersionRequest,
];
