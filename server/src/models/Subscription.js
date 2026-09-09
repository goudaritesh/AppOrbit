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
    cancelledAt: {
      type: Date,
      default: null,
    },
    appsLimit: {
      type: Number,
      required: true,
      default: 1,
    },
    applicationsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageResetDate: {
      type: Date,
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
  }
);

// Virtual aliases
subscriptionSchema.virtual('applicationLimit').get(function () {
  return this.appsLimit;
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
