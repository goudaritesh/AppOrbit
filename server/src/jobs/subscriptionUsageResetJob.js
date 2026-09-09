import { Subscription } from '../models/Subscription.js';
import { NotificationDispatcher } from '../services/notification/notificationDispatcher.js';

/**
 * Subscription Monthly Usage Reset Job (Phase 8 Production Implementation)
 * Resets applicationsUsed counter upon monthly usage cycle reset dates.
 */
export class SubscriptionUsageResetJob {
  /**
   * Reset quota counters for all active subscriptions whose usage period ended
   */
  static async processUsageResets() {
    try {
      const now = new Date();

      const overdueResets = await Subscription.find({
        status: 'ACTIVE',
        usageResetDate: { $lte: now },
      });

      let resetCount = 0;

      for (const sub of overdueResets) {
        // Advance reset date by 1 month
        const nextReset = new Date(sub.usageResetDate || now);
        nextReset.setMonth(nextReset.getMonth() + 1);

        sub.applicationsUsed = 0;
        sub.usageResetDate = nextReset;
        await sub.save();
        resetCount++;

        // Inform developer of quota replenishment via real-time socket
        await NotificationDispatcher.dispatchNotification({
          recipientId: sub.developer,
          type: 'SYSTEM',
          title: 'Monthly Application Quota Refreshed',
          message: 'Your application publishing quota has been reset for the new billing cycle.',
          priority: 'LOW',
          data: {
            applicationsUsed: 0,
            usageResetDate: nextReset,
          },
        });
      }

      return { success: true, resetCount };
    } catch (err) {
      console.error('[SubscriptionUsageResetJob Error]:', err.message);
      return { success: false, error: err.message };
    }
  }
}

export default SubscriptionUsageResetJob;
