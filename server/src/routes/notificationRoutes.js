import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  registerDeviceToken,
  unregisterDeviceToken,
} from '../controllers/notification/notificationController.js';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/:notificationId/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotification);

// Notification Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Device Tokens
router.post('/device-tokens', registerDeviceToken);
router.delete('/device-tokens/:token', unregisterDeviceToken);

export default router;
