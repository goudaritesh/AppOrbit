import AppError from './AppError.js';

/**
 * Validates that an authenticated user is either the owner of a resource
 * or an elevated platform administrator (ADMIN / SUPER_ADMIN).
 *
 * @param {string|object} resourceOwnerId - ID of the resource owner
 * @param {object} user - Authenticated user object from req.user
 * @param {string} [resourceName='resource'] - Name of resource for error messaging
 * @returns {boolean} True if authorized, throws AppError 403 otherwise
 */
export const checkOwnership = (resourceOwnerId, user, resourceName = 'resource') => {
  if (!user) {
    throw new AppError('Authentication required to verify resource ownership', 401);
  }

  // Admins and Super Admins have universal clearance
  if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return true;
  }

  const ownerIdStr = resourceOwnerId?.toString ? resourceOwnerId.toString() : String(resourceOwnerId);
  const userIdStr = (user._id || user.id)?.toString ? (user._id || user.id).toString() : String(user._id || user.id);

  if (ownerIdStr !== userIdStr) {
    throw new AppError(
      `You do not have permission to modify or access this ${resourceName}.`,
      403
    );
  }

  return true;
};

export default {
  checkOwnership,
};
