import mongoose from 'mongoose';

/**
 * Subscription Plan Model (Phase 7 Production Implementation)
 * Configurable pricing tiers and monthly application allotment quotas.
 */
const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, 'Plan slug is required'],
      trim: true,
      unique: true,
      lowercase: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    publishingCredits: {
      type: Number,
      required: [true, 'Publishing credits limit is required'],
      min: [1, 'Credits must be at least 1'],
    },
    billingPeriod: {
      type: String,
      enum: ['MONTHLY', 'ANNUAL', 'LIFETIME', 'ONE-TIME'],
      default: 'ONE-TIME',
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias for Sprint 8 spec compatibility
subscriptionPlanSchema.virtual('billingCycle').get(function () {
  return this.billingPeriod;
}).set(function (val) {
  this.billingPeriod = val;
});

export const DEFAULT_PLANS = [
  {
    name: 'Free Starter',
    slug: 'free',
    price: 0,
    currency: 'INR',
    publishingCredits: 1,
    billingPeriod: 'LIFETIME',
    features: [
      'Lifetime Developer Account',
      '1 Application Publishing Credit',
      'Latest Verified APK Storage',
      'SHA-256 Verification & Basic Malware Scan',
      'Application Updates'
    ],
    isActive: true,
    displayOrder: 1,
    isDefault: true,
  },
  {
    name: 'Silver Developer',
    slug: 'silver',
    price: 399,
    currency: 'INR',
    publishingCredits: 5,
    billingPeriod: 'ONE-TIME',
    features: [
      'Lifetime Developer Account',
      '5 Application Publishing Credits',
      'Latest Verified APK Storage',
      'Malware Scan, APK Validation & Signature Verification',
      'Application Updates'
    ],
    isActive: true,
    displayOrder: 2,
    isDefault: false,
  },
  {
    name: 'Gold Developer',
    slug: 'gold',
    price: 599,
    currency: 'INR',
    publishingCredits: 10,
    billingPeriod: 'ONE-TIME',
    features: [
      'Lifetime Developer Account',
      '10 Application Publishing Credits',
      'Priority Review & Priority Support',
      'Advanced Analytics',
      'More Storage Capacity'
    ],
    isActive: true,
    displayOrder: 3,
    isDefault: false,
  },
  {
    name: 'Diamond Enterprise',
    slug: 'diamond',
    price: 999,
    currency: 'INR',
    publishingCredits: 25,
    billingPeriod: 'ONE-TIME',
    features: [
      'Lifetime Developer Account',
      '25 Application Publishing Credits',
      'Higher Storage Capacity',
      'Enhanced Developer Profile',
      'Priority Review & Priority Support'
    ],
    isActive: true,
    displayOrder: 4,
    isDefault: false,
  },
];

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export const Plan = SubscriptionPlan;
export default SubscriptionPlan;
