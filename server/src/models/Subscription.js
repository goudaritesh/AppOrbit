import mongoose from 'mongoose';

/**
 * Developer Subscription Model (Phase 8 Production Implementation)
 * Tracks developer plan lifecycle, quota consumption, atomic usage reservation, and renewal dates.
 */
const subscriptionSchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    planSlug: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'PENDING', 'PAYMENT_FAILED'],
      default: 'ACTIVE',
      index: true,
    },
    billingPeriod: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME'],
      default: 'MONTHLY',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null, // null for lifetime free
    },
    usageResetDate: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    publishingCredits: {
      total: { type: Number, default: 1 },
      used: { type: Number, default: 0 },
    },
    upgradedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    paymentReference: {
      type: String,
      default: '',
    },
    scheduledPlanChange: {
      targetPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        default: null,
      },
      targetPlanSlug: {
        type: String,
        default: '',
      },
      effectiveDate: {
        type: Date,
        default: null,
      },
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null if self-service, populated if granted manually by admin
    },
    adminNotes: {
      type: String,
      default: '',
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for Sprint 8 spec compatibility
subscriptionSchema.virtual('developerId').get(function () {
  return this.developer;
});

subscriptionSchema.virtual('planId').get(function () {
  return this.plan;
});

subscriptionSchema.virtual('appLimit').get(function () {
  return this.publishingCredits?.total || 0;
}).set(function (val) {
  if (!this.publishingCredits) this.publishingCredits = {};
  this.publishingCredits.total = val;
});

subscriptionSchema.virtual('appsUsed').get(function () {
  return this.publishingCredits?.used || 0;
}).set(function (val) {
  if (!this.publishingCredits) this.publishingCredits = {};
  this.publishingCredits.used = val;
});

subscriptionSchema.virtual('paymentId').get(function () {
  return this.paymentReference;
});

subscriptionSchema.virtual('applicationLimit').get(function () {
  return this.publishingCredits?.total || 0;
});

subscriptionSchema.virtual('expiresAt').get(function () {
  return this.endDate;
});

subscriptionSchema.virtual('startedAt').get(function () {
  return this.startDate;
});

subscriptionSchema.index({ developer: 1, status: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
