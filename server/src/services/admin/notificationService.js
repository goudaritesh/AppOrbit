import { AdminNotification } from '../../models/AdminNotification.js';

/**
 * Admin Notification Service (Phase 7 Production Implementation)
 * Records high-priority events in the administrative notification center.
 */
export class NotificationService {
  /**
   * Send notification to admins
   * @param {Object} params
   * @param {string} params.type
   * @param {string} params.title
   * @param {string} params.message
   * @param {string} [params.priority] - 'LOW', 'NORMAL', 'HIGH', 'CRITICAL'
   * @param {string} [params.resourceType]
   * @param {string} [params.resourceId]
   */
  static async notifyAdmin({
    type,
    title,
    message,
    priority = 'NORMAL',
    resourceType = '',
    resourceId = '',
  }) {
    try {
      return await AdminNotification.create({
        type,
        title,
        message,
        priority,
        resourceType,
        resourceId,
        isRead: false,
      });
    } catch (err) {
      console.error('[NotificationService] Failed to record admin notification:', err);
      return null;
    }
  }
}

export default NotificationService;
