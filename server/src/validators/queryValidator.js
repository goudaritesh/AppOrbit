import { query } from 'express-validator';
import { validate } from './authValidator.js';

/**
 * Middleware to reject NoSQL injection attempts in query parameters.
 * Blocks operators such as $ne, $gt, $regex injected via object queries.
 */
export const sanitizeQueryParams = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (key.startsWith('$') || key.includes('.')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameter syntax detected',
        });
      }
      const val = req.query[key];
      if (typeof val === 'object' && val !== null) {
        return res.status(400).json({
          success: false,
          message: 'Nested query parameter operators are not allowed',
        });
      }
    }
  }
  next();
};

/**
 * Validation rules for marketplace exploration & search queries
 */
export const appQueryValidation = [
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
  query('sort')
    .optional()
    .isIn(['popular', 'recent', 'rating', 'downloads', 'alphabetical'])
    .withMessage('Sort must be one of: popular, recent, rating, downloads, alphabetical'),
  query('category')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Category filter cannot exceed 60 characters'),
  query('platform')
    .optional()
    .isIn(['ANDROID', 'WEB', 'IOS'])
    .withMessage('Platform must be ANDROID, WEB, or IOS'),
  query('technology')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Technology filter cannot exceed 50 characters'),
  query('verified')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('Verified filter must be a boolean string (true/false)'),
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),
];

export { validate };
