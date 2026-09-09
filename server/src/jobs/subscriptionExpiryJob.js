import { Subscription } from '../models/Subscription.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { NotificationDispatcher } from '../services/notification/notificationDispatcher.js';

/**
 * Subscription Expiry & Expiration Warning Job (Phase 8 Production Implementation)
 * Runs periodically to flag expired subscriptions, apply Free plan downgrades,
 * and dispatch timely expiration warnings to developers.
 */
export class SubscriptionExpiryJob {
  /**
   * Process all expired subscriptions
   */
  static async processExpiredSubscriptions() {
    try {
      const now = new Date();

      // 1. Find ACTIVE subscriptions that have passed their expiration date
      const expiredSubs = await Subscription.find({
        status: 'ACTIVE',
        $or: [
          { endDate: { $lte: now } },
          { expiresAt: { $lte: now } },
        ],
      }).populate('plan').populate('developer');

      let processedCount = 0;

      for (const sub of expiredSubs) {
        // If scheduled plan change exists (e.g. downgrade), execute it now
        if (sub.scheduledPlanChange && sub.scheduledPlanChange.planId) {
          const targetPlan = await SubscriptionPlan.findById(sub.scheduledPlanChange.planId);
          if (targetPlan) {
            sub.plan = targetPlan._id;
            sub.planSlug = targetPlan.slug;
            sub.appsLimit = targetPlan.appLimit || targetPlan.applicationLimit;
            sub.applicationLimit = targetPlan.appLimit || targetPlan.applicationLimit;
            sub.applicationsUsed = 0;
            sub.scheduledPlanChange = null;
            
            // Set next billing cycle
            const nextEnd = new Date(now);
            nextEnd.setDate(nextEnd.getDate() + (targetPlan.billingPeriod === 'ANNUAL' ? 365 : 30));
            sub.startDate = now;
            sub.startedAt = now;
            sub.endDate = nextEnd;
            sub.expiresAt = nextEnd;
            sub.status = 'ACTIVE';

            await sub.save();

            await NotificationDispatcher.dispatchNotification({
              recipientId: sub.developer._id || sub.developer,
              type: 'SUBSCRIPTION_ACTIVATED',
              title: `Downgrade to ${targetPlan.name} Completed`,
              message: `Your subscription has transitioned to the ${targetPlan.name} plan.`,
              priority: 'NORMAL',
              data: { planSlug: targetPlan.slug },
            });

            processedCount++;
            continue;
          }
        }

        // Otherwise transition to EXPIRED
        sub.status = 'EXPIRED';
        await sub.save();
        processedCount++;

        const planName = sub.plan?.name || sub.planSlug || 'Paid';

        // Dispatch alert to developer
        await NotificationDispatcher.dispatchNotification({
          recipientId: sub.developer._id || sub.developer,
          type: 'SUBSCRIPTION_EXPIRED',
          title: `Subscription Expired (${planName})`,
          message: `Your ${planName} subscription has expired. Application creation limits have reverted to the Free plan tier.`,
          priority: 'HIGH',
          data: {
            subscriptionId: sub._id,
            planSlug: sub.planSlug,
            expiredAt: now,
          },
        });
      }

      // 2. Expiration Warnings (7 days, 3 days, 1 day)
      const warningWindows = [7, 3, 1];
      for (const days of warningWindows) {
        const windowStart = new Date(now.getTime() + (days - 0.5) * 86400000);
        const windowEnd = new Date(now.getTime() + (days + 0.5) * 86400000);

        const expiringSoonSubs = await Subscription.find({
          status: 'ACTIVE',
          endDate: { $gte: windowStart, $lte: windowEnd },
        }).populate('plan');

        for (const sub of expiringSoonSubs) {
          await NotificationDispatcher.dispatchNotification({
            recipientId: sub.developer,
            type: 'SUBSCRIPTION_EXPIRING',
            title: `Subscription Expiring in ${days} Day${days > 1 ? 's' : ''}`,
            message: `Your ${sub.plan?.name || sub.planSlug} plan expires on ${new Date(sub.endDate).toLocaleDateString()}. Renew your plan to avoid publishing interruption.`,
            priority: days === 1 ? 'HIGH' : 'NORMAL',
            data: {
              subscriptionId: sub._id,
              daysRemaining: days,
              expiresAt: sub.endDate,
            },
          });
        }
      }

      return { success: true, processedCount };
    } catch (err) {
      console.error('[SubscriptionExpiryJob Error]:', err.message);
      return { success: false, error: err.message };
    }
  }
}

export default SubscriptionExpiryJob;
