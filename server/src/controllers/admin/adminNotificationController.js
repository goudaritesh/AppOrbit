import { AdminNotification } from '../../models/AdminNotification.js';

/**
 * Admin Notification Controller (Phase 7 Production Implementation)
 * Manages administrative alert dispatch and inbox status.
 */

/**
 * GET /api/admin/notifications
 * Query notification alerts with unread counter
 */
export const getAdminNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { unreadOnly, priority } = req.query;
    const filter = {};

    if (unreadOnly === 'true') filter.isRead = false;
    if (priority && priority !== 'ALL') filter.priority = priority;

    const [notifications, total, unreadCount] = await Promise.all([
      AdminNotification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AdminNotification.countDocuments(filter),
      AdminNotification.countDocuments({ isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
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
 * PATCH /api/admin/notifications/:id/read
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await AdminNotification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notification.isRead = true;
    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
    }
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: { notification },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/notifications/read-all
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await AdminNotification.updateMany(
      { isRead: false },
      { $set: { isRead: true }, $addToSet: { readBy: req.user._id } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
