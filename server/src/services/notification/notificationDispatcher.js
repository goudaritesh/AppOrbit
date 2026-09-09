import { Notification } from '../../models/Notification.js';
import { NotificationPreference } from '../../models/NotificationPreference.js';
import { emitToUser } from '../../realtime/socket.js';
import { fcmService } from './fcmService.js';
import { emailService } from './emailService.js';

/**
 * Unified Multi-Channel Notification Dispatcher (Phase 8 Production Implementation)
 * Ingests platform domain events, persists to database, and synchronously fans out
 * across WebSockets, Web Push (FCM), and Transactional Email based on user preferences.
 */
export class NotificationDispatcher {
  /**
   * Dispatch a notification across all authorized channels
   * @param {Object} options
   * @param {string|mongoose.Types.ObjectId} options.recipient
   * @param {string} options.type
   * @param {string} options.title
   * @param {string} options.message
   * @param {string} [options.priority='NORMAL']
   * @param {string} [options.actionUrl='']
   * @param {Object} [options.data={}]
   * @param {string} [options.category='system'] - 'application'|'payment'|'subscription'|'support'|'system'
   */
  static async dispatch({
    recipient,
    type,
    title,
    message,
    priority = 'NORMAL',
    actionUrl = '',
    data = {},
    category = 'system',
  }) {
    try {
      // 1. Persist notification in database
      const notification = await Notification.create({
        recipient,
        type,
        title,
        message,
        priority,
        actionUrl,
        data,
      });

      // 2. Real-Time WebSocket broadcast to user-isolated room
      emitToUser(recipient, 'notification:new', {
        id: notification._id,
        type,
        title,
        message,
        priority,
        actionUrl,
        createdAt: notification.createdAt,
      });

      // 3. Check user delivery preferences
      let prefs = await NotificationPreference.findOne({ user: recipient });
      if (!prefs) {
        prefs = {
          email: { enabled: true },
          push: { enabled: true },
          application: true,
          payment: true,
          subscription: true,
          support: true,
        };
      }

      // Check if user has opted into this category
      const categoryAllowed = prefs[category] ?? true;

      if (categoryAllowed) {
        // 4. Send Web Push via FCM (asynchronous)
        if (prefs.push?.enabled) {
          fcmService
            .sendPushNotification(recipient, {
              title,
              body: message,
              url: actionUrl,
              data: { type, priority },
            })
            .catch((err) => console.error('[NotificationDispatcher] FCM Push error:', err.message));
        }

        // 5. Send Transactional Email (asynchronous queue)
        if (prefs.email?.enabled && ['HIGH', 'CRITICAL'].includes(priority)) {
          emailService
            .sendTransactionalEmail({
              userId: recipient,
              subject: title,
              title,
              message,
              actionUrl,
            })
            .catch((err) => console.error('[NotificationDispatcher] Email error:', err.message));
        }
      }

      return notification;
    } catch (err) {
      console.error('[NotificationDispatcher] Error dispatching notification:', err);
      // Fail-soft to prevent crashing primary workflow
      return null;
    }
  }

  /**
   * Helper: Dispatch Payment Confirmation Alert
   */
  static async dispatchPaymentSuccess({ developerId, payment, receipt, planName }) {
    return this.dispatch({
      recipient: developerId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Confirmed & Plan Activated',
      message: `Your payment of ₹${payment.amount} for ${planName} was successful. Receipt #${receipt.receiptNumber} generated.`,
      priority: 'HIGH',
      actionUrl: '/developer/payments',
      category: 'payment',
      data: { paymentId: payment.paymentId, receiptNumber: receipt.receiptNumber },
    });
  }

  /**
   * Helper: Dispatch Application Moderation Result
   */
  static async dispatchAppModeration({ developerId, app, status, reason }) {
    let type = 'APP_PUBLISHED';
    let priority = 'NORMAL';
    let title = `Application ${app.name} Published`;
    let message = `Congratulations! Your application "${app.name}" has been published to the AppOrbit Marketplace.`;

    if (status === 'CHANGES_REQUESTED') {
      type = 'APP_CHANGES_REQUESTED';
      priority = 'HIGH';
      title = `Changes Requested: ${app.name}`;
      message = `Admin requested modifications on "${app.name}": ${reason}`;
    } else if (status === 'REJECTED') {
      type = 'APP_REJECTED';
      priority = 'HIGH';
      title = `Application Submission Rejected: ${app.name}`;
      message = `Your application "${app.name}" was not approved: ${reason}`;
    } else if (status === 'BLOCKED') {
      type = 'APP_BLOCKED';
      priority = 'CRITICAL';
      title = `URGENT: Application Blocked: ${app.name}`;
      message = `"${app.name}" has been removed from distribution: ${reason}`;
    }

    return this.dispatch({
      recipient: developerId,
      type,
      title,
      message,
      priority,
      actionUrl: `/developer/apps/${app._id}`,
      category: 'application',
      data: { appId: app._id, status },
    });
  }

  /**
   * Helper: Dispatch Support Response Alert
   */
  static async dispatchSupportReply({ recipient, ticket, messageContent }) {
    return this.dispatch({
      recipient,
      type: 'SUPPORT_REPLY',
      title: `Update on Ticket ${ticket.ticketNumber || `#${ticket._id.toString().slice(-6)}`}`,
      message: `A support specialist responded to "${ticket.subject}": ${messageContent.slice(0, 120)}...`,
      priority: 'HIGH',
      actionUrl: `/admin/support/${ticket._id}`,
      category: 'support',
      data: { ticketId: ticket._id },
    });
  }

  /**
   * Helper: Generic dispatch alias supporting recipientId parameter
   */
  static async dispatchNotification(options) {
    return this.dispatch({
      ...options,
      recipient: options.recipient || options.recipientId,
    });
  }
}

export default NotificationDispatcher;
