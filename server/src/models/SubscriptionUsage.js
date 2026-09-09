import mongoose from 'mongoose';

/**
 * Subscription Periodic Usage Model (Sprint 8 Requirement 21)
 * Records and audits apps published during each discrete monthly billing period.
 */
const subscriptionUsageSchema = new mongoose.Schema(
  {
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    appsPublished: {
      type: Number,
      default: 0,
      min: 0,
    },
    publishedAppIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

subscriptionUsageSchema.virtual('subscriptionId').get(function () {
  return this.subscription;
});

subscriptionUsageSchema.index({ subscription: 1, periodStart: -1 });

export const SubscriptionUsage = mongoose.model('SubscriptionUsage', subscriptionUsageSchema);
export default SubscriptionUsage;
