import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Validates JWT access token, checks user existence, active account status,
 * and validates that password was not changed after token issuance.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract Bearer token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please authenticate to gain access.', 401)
    );
  }

  // 2. Verify JWT access token
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please refresh your token.', 401));
    }
    return next(new AppError('Invalid authentication token. Please log in again.', 401));
  }

  // 3. Verify user still exists in database
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this authentication token no longer exists.', 401)
    );
  }

  // 4. Verify account status (reject SUSPENDED or BANNED)
  if (currentUser.accountStatus === 'SUSPENDED') {
    return next(
      new AppError(
        'Your account has been temporarily suspended. Please contact platform support.',
        403
      )
    );
  }

  if (currentUser.accountStatus === 'BANNED') {
    return next(
      new AppError(
        'Your account has been permanently banned from AppOrbit for policy violations.',
        403
      )
    );
  }

  // 5. Verify password was not changed after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password was recently changed. Please log in again with your new credentials.', 401)
    );
  }

  // 6. Grant access by attaching authenticated user to request
  req.user = currentUser;
  next();
});

// Alias for protect
export const authenticate = protect;

/**
 * Role-Based Access Control Middleware
 * Restricts route access to specified roles (e.g. 'DEVELOPER', 'ADMIN', 'SUPER_ADMIN').
 *
 * @param  {...string} roles - Permitted user roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches req.user if a valid bearer token is supplied, but proceeds normally if absent.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const currentUser = await User.findById(decoded.id);
    if (currentUser && currentUser.accountStatus === 'ACTIVE') {
      req.user = currentUser;
    }
  } catch (_err) {
    // Ignore invalid/expired token in optional mode
  }
  next();
});

export default {
  protect,
  authenticate,
  authorizeRoles,
  optionalAuth,
};
