import { Subscription } from '../models/Subscription.js';
import { NotificationDispatcher } from '../services/notification/notificationDispatcher.js';

/**
 * Subscription Annual Usage Reset Job (Phase 8 Production Implementation)
 * Resets applicationsUsed counter upon annual usage cycle reset dates.
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
        // Advance reset date by 1 year
        const nextReset = new Date(sub.usageResetDate || now);
        nextReset.setFullYear(nextReset.getFullYear() + 1);

        if (!sub.publishingCredits) sub.publishingCredits = { total: sub.publishingCredits?.total || 1, used: 0 };
        else sub.publishingCredits.used = 0;
        
        sub.usageResetDate = nextReset;
        await sub.save();
        resetCount++;

        // Inform developer of quota replenishment via real-time socket
        await NotificationDispatcher.dispatchNotification({
          recipientId: sub.developer,
          type: 'SYSTEM',
          title: 'Annual Application Quota Refreshed',
          message: 'Your application publishing quota has been reset for the new year.',
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
