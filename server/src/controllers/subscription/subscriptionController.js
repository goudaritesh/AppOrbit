import { SubscriptionPlan, DEFAULT_PLANS } from '../../models/SubscriptionPlan.js';
import { Subscription } from '../../models/Subscription.js';
import { SubscriptionService } from '../../services/subscription/subscriptionService.js';
import { SubscriptionLimitService } from '../../services/admin/subscriptionLimitService.js';
import AppError from '../../utils/AppError.js';

/**
 * Developer Subscription Controller (Phase 8 Production Implementation)
 * Handles tier discovery, current entitlement status, usage telemetry, and renewal cancellations.
 */

/**
 * GET /api/subscription/plans
 * List all active subscription plans (Public / Developer)
 */
export const getPublicPlans = async (req, res, next) => {
  try {
    let plans = await SubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1 });
    if (plans.length === 0) {
      await SubscriptionPlan.insertMany(DEFAULT_PLANS);
      plans = await SubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1 });
    } else {
      const diamond = plans.find((p) => p.slug === 'diamond');
      if (diamond && diamond.appLimit !== 20) {
        diamond.appLimit = 20;
        await diamond.save();
      }
    }
    return res.status(200).json({
      success: true,
      data: { plans },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/developer/subscription
 * Retrieve developer's active subscription details and billing period
 */
export const getDeveloperSubscription = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const subscription = await SubscriptionLimitService.getOrCreateActiveSubscription(developerId);

    return res.status(200).json({
      success: true,
      data: { subscription },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/developer/subscription/usage
 * Telemetry endpoint providing plan limits, applications used, and remaining quota
 */
export const getDeveloperUsage = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const usage = await SubscriptionLimitService.getUsageTelemetry(developerId);

    return res.status(200).json({
      success: true,
      data: { usage },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/developer/subscription/cancel
 * Cancel automatic renewal (subscription stays active until current period end)
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const { reason } = req.body;

    const subscription = await SubscriptionService.cancelAutoRenewal(developerId, reason);

    return res.status(200).json({
      success: true,
      message: 'Automatic subscription renewal has been cancelled.',
      data: { subscription },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/developer/subscription/change-plan
 * Request plan change (immediate upgrade or scheduled downgrade)
 */
export const changePlan = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const { targetPlanId, strategy = 'SCHEDULED' } = req.body;

    if (!targetPlanId) {
      return next(new AppError('Target plan ID is required', 400));
    }

    const targetPlan = await SubscriptionPlan.findById(targetPlanId);
    if (!targetPlan) {
      return next(new AppError('Target plan not found', 404));
    }

    const currentSub = await SubscriptionLimitService.getOrCreateActiveSubscription(developerId);

    // If target is Free Starter or cheaper, schedule downgrade
    if (targetPlan.price < (currentSub.plan?.price || 0) || strategy === 'SCHEDULED') {
      const subscription = await SubscriptionService.scheduleDowngrade(developerId, targetPlanId);
      return res.status(200).json({
        success: true,
        message: `Downgrade scheduled for end of billing cycle (${subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'period end'}).`,
        data: { subscription },
      });
    }

    // For upgrades, redirect to payment checkout flow
    return res.status(200).json({
      success: true,
      requiresPayment: true,
      message: 'Upgrade requires payment confirmation.',
      targetPlan,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getPublicPlans,
  getDeveloperSubscription,
  getDeveloperUsage,
  cancelSubscription,
  changePlan,
};
