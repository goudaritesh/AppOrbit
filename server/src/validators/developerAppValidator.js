import { body, query } from 'express-validator';
import mongoose from 'mongoose';
import { validate } from './authValidator.js';

/**
 * Sanitizes URLs to prevent XSS (blocks javascript: and data: protocols)
 */
const isValidWebUrl = (value) => {
  if (!value) return true;
  const str = String(value).trim().toLowerCase();
  if (str.startsWith('javascript:') || str.startsWith('data:')) {
    return false;
  }
  return /^https?:\/\/.+/.test(str);
};

/**
 * Strips restricted fields that developers must never tamper with
 */
export const stripRestrictedAppFields = (req, res, next) => {
  const restrictedKeys = [
    'developer',
    'status',
    'verificationStatus',
    'visibility',
    'downloadCount',
    'viewCount',
    'ratingAverage',
    'ratingCount',
    'featured',
    'featuredOrder',
    'publishedAt',
    'createdAt',
    'updatedAt',
    'adminNotes',
    'securityScan',
  ];

  if (req.body && typeof req.body === 'object') {
    for (const key of restrictedKeys) {
      delete req.body[key];
    }
  }
  next();
};

/**
 * Validation schema for creating application drafts
 */
export const createAppValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Application name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Application name must be between 2 and 100 characters'),
  body('shortDescription')
    .trim()
    .notEmpty()
    .withMessage('Short description is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Short description must be between 5 and 200 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid category ID'),
  body('platform')
    .optional()
    .isIn(['ANDROID', 'WEB', 'IOS'])
    .withMessage('Platform must be ANDROID, WEB, or IOS'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Description cannot exceed 10,000 characters'),
  body('tags')
    .optional()
    .isArray({ max: 15 })
    .withMessage('Maximum 15 tags allowed'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Individual tag cannot exceed 30 characters'),
  body('features')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 features allowed'),
  body('features.*')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Individual feature cannot exceed 150 characters'),
  body('technologies')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 technologies allowed'),
  body('technologies.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Individual technology cannot exceed 50 characters'),
  body('icon')
    .optional()
    .custom(isValidWebUrl)
    .withMessage('Application icon must be a valid HTTP/HTTPS URL'),
  body('githubUrl')
    .optional()
    .custom(isValidWebUrl)
    .withMessage('GitHub URL must be a valid HTTP/HTTPS URL'),
  body('demoUrl')
    .optional()
    .custom(isValidWebUrl)
    .withMessage('Demo URL must be a valid HTTP/HTTPS URL'),
];

/**
 * Validation schema for updating existing applications
 */
export const updateAppValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Application name must be between 2 and 100 characters'),
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Short description must be between 5 and 200 characters'),
  body('category')
    .optional()
    .trim()
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid category ID'),
  body('platform')
    .optional()
    .isIn(['ANDROID', 'WEB', 'IOS'])
    .withMessage('Platform must be ANDROID, WEB, or IOS'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Description cannot exceed 10,000 characters'),
  body('tags')
    .optional()
    .isArray({ max: 15 })
    .withMessage('Maximum 15 tags allowed'),
  body('features')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 features allowed'),
  body('technologies')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 technologies allowed'),
  body('icon')
    .optional()
    .custom(isValidWebUrl)
    .withMessage('Application icon must be a valid HTTP/HTTPS URL'),
  body('githubUrl')
    .optional()
    .custom(isValidWebUrl)
    .withMessage('GitHub URL must be a valid HTTP/HTTPS URL'),
  body('demoUrl')
    .optional()
    .custom(isValidWebUrl)
    .withMessage('Demo URL must be a valid HTTP/HTTPS URL'),
  body('externalApkUrl')
    .optional()
    .custom(isValidWebUrl)
    .withMessage('External APK URL must be a valid HTTP/HTTPS URL'),
];

/**
 * Validation for developer queries (My Apps list)
 */
export const developerAppQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer >= 1')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  query('status')
    .optional()
    .isIn([
      'DRAFT',
      'PENDING_REVIEW',
      'APPROVED',
      'REJECTED',
      'SUSPENDED',
      'ARCHIVED',
      'PUBLISHED',
    ])
    .withMessage('Invalid status filter'),
  query('category')
    .optional()
    .isString()
    .trim(),
  query('platform')
    .optional()
    .isIn(['ANDROID', 'WEB', 'IOS'])
    .withMessage('Platform must be ANDROID, WEB, or IOS'),
  query('sort')
    .optional()
    .isIn(['updatedAt', 'createdAt', 'name', 'downloadCount', 'viewCount'])
    .withMessage('Sort must be one of: updatedAt, createdAt, name, downloadCount, viewCount'),
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 }),
];

export { validate };
