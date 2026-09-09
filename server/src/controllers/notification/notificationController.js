import { Notification } from '../../models/Notification.js';
import { NotificationPreference } from '../../models/NotificationPreference.js';
import { fcmService } from '../../services/notification/fcmService.js';
import AppError from '../../utils/AppError.js';

/**
 * User & Developer Notification Controller (Phase 8 Production Implementation)
 * In-app notification center, unread counters, preferences, and FCM token management.
 */

/**
 * GET /api/notifications
 * Paginated list of notifications for the authenticated user
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const { unreadOnly, priority } = req.query;
    const filter = { recipient: userId };

    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, isRead: false }),
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
 * GET /api/notifications/unread-count
 * Quick counter for navbar badge
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/:notificationId/read
 * Mark a single notification as read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: req.user._id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/read-all
 * Mark all user notifications as read
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notifications/:notificationId
 * Delete an individual notification
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const result = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      recipient: req.user._id,
    });

    if (!result) {
      return next(new AppError('Notification not found', 404));
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/settings/notifications
 * Retrieve notification preferences
 */
export const getPreferences = async (req, res, next) => {
  try {
    let prefs = await NotificationPreference.findOne({ user: req.user._id });
    if (!prefs) {
      prefs = await NotificationPreference.create({ user: req.user._id });
    }

    return res.status(200).json({
      success: true,
      data: { preferences: prefs },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/settings/notifications
 * Update notification preferences
 */
export const updatePreferences = async (req, res, next) => {
  try {
    const { email, push, application, payment, subscription, support } = req.body;

    const prefs = await NotificationPreference.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          ...(email !== undefined && { email }),
          ...(push !== undefined && { push }),
          ...(application !== undefined && { application }),
          ...(payment !== undefined && { payment }),
          ...(subscription !== undefined && { subscription }),
          ...(support !== undefined && { support }),
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated.',
      data: { preferences: prefs },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/device-tokens
 * Register an FCM device token for web push
 */
export const registerDeviceToken = async (req, res, next) => {
  try {
    const { token, platform = 'WEB' } = req.body;
    if (!token) return next(new AppError('Device token is required', 400));

    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
    };

    const device = await fcmService.registerToken(req.user._id, token, platform, deviceInfo);

    return res.status(201).json({
      success: true,
      message: 'Device token registered for push notifications.',
      data: { device },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/device-tokens/:token
 * Unregister device token
 */
export const unregisterDeviceToken = async (req, res, next) => {
  try {
    await fcmService.unregisterToken(req.params.token);
    return res.status(200).json({
      success: true,
      message: 'Device token unregistered.',
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  registerDeviceToken,
  unregisterDeviceToken,
};
