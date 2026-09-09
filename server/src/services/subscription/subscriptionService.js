import { Subscription } from '../../models/Subscription.js';
import { SubscriptionPlan, DEFAULT_PLANS } from '../../models/SubscriptionPlan.js';
import { User } from '../../models/User.js';
import { emitToUser } from '../../realtime/socket.js';
import AppError from '../../utils/AppError.js';

/**
 * Centralized Subscription Lifecycle Service (Phase 8 Production Implementation)
 * Orchestrates plan activations, renewals, upgrades, downgrades, and expirations.
 */
export class SubscriptionService {
  /**
   * Activate or renew a developer subscription following verified payment or admin grant
   * @param {Object} params
   * @param {string} params.developerId
   * @param {string} params.planId
   * @param {string} [params.paymentId]
   * @param {number} [params.durationDays=30]
   * @param {boolean} [params.autoRenew=false]
   * @returns {Promise<Subscription>}
   */
  static async activateSubscription({
    developerId,
    planId,
    paymentId,
    durationDays = 30,
    autoRenew = false,
  }) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      throw new AppError('Target subscription plan not found', 404);
    }

    const developer = await User.findById(developerId);
    if (!developer) {
      throw new AppError('Developer account not found', 404);
    }

    // 1. Cancel previous active subscriptions gracefully
    await Subscription.updateMany(
      { developer: developerId, status: 'ACTIVE' },
      { $set: { status: 'CANCELLED', cancelledAt: new Date() } }
    );

    // 2. Compute date boundaries
    const startDate = new Date();
    let endDate = null;
    let usageResetDate = new Date();
    usageResetDate.setDate(usageResetDate.getDate() + 30);

    if (plan.slug !== 'free') {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
    }

    // 3. Create active subscription
    const subscription = await Subscription.create({
      developer: developerId,
      plan: plan._id,
      planSlug: plan.slug,
      status: 'ACTIVE',
      billingPeriod: plan.billingPeriod || 'MONTHLY',
      startDate,
      endDate,
      appsLimit: plan.appLimit,
      applicationsUsed: 0,
      usageResetDate,
      autoRenew,
      paymentReference: paymentId ? paymentId.toString() : '',
    });

    // 4. Emit live real-time event to developer session
    emitToUser(developerId, 'subscription:updated', {
      status: 'ACTIVE',
      plan: {
        id: plan._id,
        name: plan.name,
        slug: plan.slug,
        appLimit: plan.appLimit,
      },
      expiresAt: endDate,
      remainingApps: plan.appLimit,
    });

    return subscription;
  }

  /**
   * Cancel automatic renewal (keeps subscription active until current period end)
   * @param {string} developerId
   * @param {string} reason
   * @returns {Promise<Subscription>}
   */
  static async cancelAutoRenewal(developerId, reason = '') {
    const activeSub = await Subscription.findOne({
      developer: developerId,
      status: 'ACTIVE',
    }).populate('plan');

    if (!activeSub) {
      throw new AppError('No active subscription found to cancel', 404);
    }

    activeSub.autoRenew = false;
    activeSub.cancelledAt = new Date();
    if (reason) activeSub.adminNotes = `Cancellation reason: ${reason}`;
    await activeSub.save();

    emitToUser(developerId, 'subscription:updated', {
      status: 'ACTIVE',
      autoRenew: false,
      cancelledAt: activeSub.cancelledAt,
    });

    return activeSub;
  }

  /**
   * Schedule plan downgrade for next billing cycle
   * @param {string} developerId
   * @param {string} targetPlanId
   * @returns {Promise<Subscription>}
   */
  static async scheduleDowngrade(developerId, targetPlanId) {
    const [activeSub, targetPlan] = await Promise.all([
      Subscription.findOne({ developer: developerId, status: 'ACTIVE' }),
      SubscriptionPlan.findById(targetPlanId),
    ]);

    if (!activeSub) throw new AppError('No active subscription found', 404);
    if (!targetPlan) throw new AppError('Target plan not found', 404);

    activeSub.scheduledPlanChange = {
      targetPlan: targetPlan._id,
      targetPlanSlug: targetPlan.slug,
      effectiveDate: activeSub.endDate || new Date(),
    };
    await activeSub.save();

    emitToUser(developerId, 'subscription:updated', {
      scheduledPlanChange: activeSub.scheduledPlanChange,
    });

    return activeSub;
  }

  /**
   * Expire an existing subscription and auto-enroll in Free Starter
   * @param {string} subscriptionId
   * @returns {Promise<Subscription>}
   */
  static async expireSubscription(subscriptionId) {
    const sub = await Subscription.findById(subscriptionId);
    if (!sub || sub.status !== 'ACTIVE') return null;

    sub.status = 'EXPIRED';
    await sub.save();

    // Check if there was a scheduled downgrade plan
    if (sub.scheduledPlanChange?.targetPlan) {
      await this.activateSubscription({
        developerId: sub.developer,
        planId: sub.scheduledPlanChange.targetPlan,
      });
    } else {
      // Re-enroll in Free Starter
      let freePlan = await SubscriptionPlan.findOne({ slug: 'free' });
      if (!freePlan) {
        freePlan = await SubscriptionPlan.create(DEFAULT_PLANS[0]);
      }
      await Subscription.create({
        developer: sub.developer,
        plan: freePlan._id,
        planSlug: freePlan.slug,
        status: 'ACTIVE',
        appsLimit: freePlan.appLimit,
        startDate: new Date(),
      });
    }

    emitToUser(sub.developer, 'subscription:updated', {
      status: 'EXPIRED',
      message: 'Your subscription period has ended. You have been switched to Free Starter.',
    });

    return sub;
  }
}

export default SubscriptionService;
