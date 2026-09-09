import { body, param, validationResult } from 'express-validator';

/**
 * Validation result handler middleware.
 * Formats express-validator rejections into standardized AppOrbit error envelopes.
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validation chains
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0]?.message || 'Validation failed',
      errors: formattedErrors,
    });
  };
};

/**
 * Signup Validation Rules
 */
export const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Please provide your name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .trim()
    .customSanitizer((val) => (val ? val.toUpperCase() : 'USER'))
    .custom((value) => {
      if (['ADMIN', 'SUPER_ADMIN'].includes(value)) {
        throw new Error('Public registration for administrative roles is strictly prohibited');
      }
      if (!['USER', 'DEVELOPER'].includes(value)) {
        throw new Error('Role must be either USER or DEVELOPER');
      }
      return true;
    }),
];

/**
 * Login Validation Rules
 */
export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password').notEmpty().withMessage('Please enter your password'),
];

/**
 * Forgot Password Validation Rules
 */
export const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

/**
 * Reset Password Validation Rules
 */
export const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

/**
 * Update Personal Profile Validation Rules
 */
export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),

  body('phoneNumber').optional().trim(),

  body('githubUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Please provide a valid GitHub URL'),

  body('portfolioUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Please provide a valid portfolio URL'),
];

/**
 * Update Developer Profile Validation Rules
 */
export const updateDeveloperProfileValidation = [
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),

  body('website')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Please provide a valid website URL'),

  body('githubProfile').optional().trim(),

  body('portfolioUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Please provide a valid portfolio URL'),

  body('developerBio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Developer bio cannot exceed 1000 characters'),
];

export default {
  validate,
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
  updateDeveloperProfileValidation,
};
