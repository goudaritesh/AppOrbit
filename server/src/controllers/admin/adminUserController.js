import { User } from '../../models/User.js';
import { AuditLogService } from '../../services/admin/auditLogService.js';

/**
 * Admin User Management Controller (Phase 7 Production Implementation)
 * Consumer accounts directory, status controls, and security restrictions.
 */

/**
 * GET /api/admin/users
 * Paginated list of consumer user accounts
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, search } = req.query;

    const filter = { role: 'USER' };

    if (status && status !== 'ALL') {
      filter.accountStatus = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users/:userId
 * Single user details
 */
export const getAdminUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, role: 'USER' }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/users/:userId/status
 * Update user account status (ACTIVE, SUSPENDED, BANNED) with reason
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status, reason = '' } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status specified.' });
    }

    const user = await User.findOne({ _id: req.params.userId, role: 'USER' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = status;
    user.suspensionReason = reason;

    await user.save();

    await AuditLogService.log({
      req,
      action: `USER_${status}`,
      resourceType: 'USER',
      resourceId: user._id,
      reason,
      previousState: { status: previousStatus },
      newState: { status },
      severity: status === 'BANNED' ? 'CRITICAL' : 'INFO',
    });

    return res.status(200).json({
      success: true,
      message: `User account status updated to ${status}.`,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
};
