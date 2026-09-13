import { body } from 'express-validator';
import { validate } from './authValidator.js';

/**
 * Sprint 11 Review Input Validation Rules
 * Protects against review injection, invalid ratings, and spam.
 */
export const createReviewValidation = validate([
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Review title cannot exceed 100 characters')
    .escape(),

  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Review comment must be between 5 and 2000 characters')
    .escape(),
]);

export const replyReviewValidation = validate([
  body('reply')
    .trim()
    .notEmpty()
    .withMessage('Developer reply text is required')
    .isLength({ min: 2, max: 2000 })
    .withMessage('Reply must be between 2 and 2000 characters')
    .escape(),
]);

export default {
  createReviewValidation,
  replyReviewValidation,
};
