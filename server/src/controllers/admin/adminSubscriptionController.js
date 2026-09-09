import { SubscriptionPlan, DEFAULT_PLANS } from '../../models/SubscriptionPlan.js';
import { Subscription } from '../../models/Subscription.js';
import { User } from '../../models/User.js';
import { AuditLogService } from '../../services/admin/auditLogService.js';

/**
 * Admin Subscription & Plan Management Controller (Phase 7 Production Implementation)
 * Manages pricing tiers, developer subscriptions, manual plan overrides, and quota allocations.
 */

/**
 * GET /api/admin/subscriptions/plans
 * List all subscription tiers with subscriber counts
 */
export const getSubscriptionPlans = async (req, res, next) => {
  try {
    let plans = await SubscriptionPlan.find().sort({ displayOrder: 1 });

    // Auto-seed default plans if collection is empty
    if (plans.length === 0) {
      await SubscriptionPlan.insertMany(DEFAULT_PLANS);
      plans = await SubscriptionPlan.find().sort({ displayOrder: 1 });
    }

    // Count subscribers per plan
    const counts = await Subscription.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

    const enriched = plans.map((p) => ({
      ...p.toObject(),
      subscriberCount: countMap.get(p._id.toString()) || 0,
    }));

    return res.status(200).json({
      success: true,
      data: { plans: enriched },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/subscriptions/plans
 * Create a new subscription plan
 */
export const createSubscriptionPlan = async (req, res, next) => {
  try {
    const { name, slug, price, currency = 'INR', appLimit, billingPeriod = 'MONTHLY', features = [] } = req.body;

    const plan = await SubscriptionPlan.create({
      name,
      slug: slug.toLowerCase().trim(),
      price,
      currency,
      appLimit,
      billingPeriod,
      features,
      isActive: true,
    });

    await AuditLogService.log({
      req,
      action: 'SUBSCRIPTION_PLAN_CREATED',
      resourceType: 'SUBSCRIPTION',
      resourceId: plan._id,
      newState: { name, slug, price, appLimit },
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully.',
      data: { plan },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/subscriptions/plans/:planId
 * Update an existing subscription plan
 */
export const updateSubscriptionPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    const previousState = plan.toObject();
    const { name, price, appLimit, features, isActive } = req.body;

    if (name !== undefined) plan.name = name;
    if (price !== undefined) plan.price = price;
    if (appLimit !== undefined) plan.appLimit = appLimit;
    if (features !== undefined) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();

    await AuditLogService.log({
      req,
      action: 'SUBSCRIPTION_PLAN_UPDATED',
      resourceType: 'SUBSCRIPTION',
      resourceId: plan._id,
      previousState,
      newState: plan.toObject(),
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully.',
      data: { plan },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/subscriptions
 * Query active/expired developer subscriptions with pagination
 */
export const getDeveloperSubscriptions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, planSlug } = req.query;
    const filter = {};

    if (status && status !== 'ALL') filter.status = status;
    if (planSlug && planSlug !== 'ALL') filter.planSlug = planSlug;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate('developer', 'name email profileImage')
        .populate('plan')
        .populate('grantedBy', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Subscription.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        subscriptions,
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
 * POST /api/admin/subscriptions/:developerId/update
 * Manually assign, upgrade, downgrade, or extend a developer subscription with mandatory reason
 */
export const manualUpdateSubscription = async (req, res, next) => {
  try {
    const { planId, planSlug, reason, status = 'ACTIVE', durationDays = 30 } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason for manual subscription modification is mandatory.',
      });
    }

    const developer = await User.findOne({ _id: req.params.developerId, role: 'DEVELOPER' });
    if (!developer) {
      return res.status(404).json({ success: false, message: 'Developer not found.' });
    }

    let plan;
    if (planId) {
      plan = await SubscriptionPlan.findById(planId);
    } else if (planSlug) {
      plan = await SubscriptionPlan.findOne({ slug: planSlug.toLowerCase() });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: `Subscription plan not found.` });
    }

    // End any current active subscriptions
    await Subscription.updateMany(
      { developer: developer._id, status: 'ACTIVE' },
      { $set: { status: 'CANCELLED' } }
    );

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(durationDays, 10));

    const newSubscription = await Subscription.create({
      developer: developer._id,
      plan: plan._id,
      planSlug: plan.slug,
      status,
      appsLimit: plan.appLimit,
      startDate: new Date(),
      endDate: plan.slug === 'free' ? null : endDate,
      grantedBy: req.user._id,
      adminNotes: reason.trim(),
    });

    await AuditLogService.log({
      req,
      action: 'SUBSCRIPTION_MANUALLY_ASSIGNED',
      resourceType: 'SUBSCRIPTION',
      resourceId: newSubscription._id,
      reason: reason.trim(),
      newState: {
        developer: developer._id,
        planSlug: plan.slug,
        appsLimit: plan.appLimit,
        endDate,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Subscription successfully updated to ${plan.name}.`,
      data: { subscription: newSubscription },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getDeveloperSubscriptions,
  manualUpdateSubscription,
};
