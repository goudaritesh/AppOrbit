import AppError from '../utils/AppError.js';
import { isAdminRole, getUserEffectivePermissions } from '../config/adminPermissions.js';

/**
 * Require any administrative staff role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required to access admin services.', 401));
  }

  if (!isAdminRole(req.user.role)) {
    return next(
      new AppError('Forbidden: You do not have administrative platform privileges.', 403)
    );
  }

  next();
};

/**
 * Require specific admin role(s)
 * @param  {...string} roles
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next(); // Super admin bypasses role-specific gates
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Action restricted to roles: [${roles.join(', ')}]. Your role is ${req.user.role}.`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Require fine-grained permission(s)
 * Admin must have all specified permissions to proceed.
 * @param  {...string} requiredPermissions
 */
export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!isAdminRole(req.user.role)) {
      return next(new AppError('Forbidden: Administrative access required.', 403));
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next(); // Super Admin has all permissions unconditionally
    }

    const effectivePermissions = getUserEffectivePermissions(req.user);
    const missingPermissions = requiredPermissions.filter(
      (perm) => !effectivePermissions.includes(perm)
    );

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSION',
        message: 'You do not have permission to perform this action.',
        required: requiredPermissions,
        missing: missingPermissions,
      });
    }

    next();
  };
};

export default {
  requireAdmin,
  requireRole,
  requirePermission,
};
