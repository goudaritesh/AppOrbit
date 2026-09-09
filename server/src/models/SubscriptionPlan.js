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
    appLimit: {
      type: Number,
      required: [true, 'App publishing/creation limit is required'],
      min: [1, 'Limit must be at least 1'],
    },
    billingPeriod: {
      type: String,
      enum: ['MONTHLY', 'ANNUAL', 'LIFETIME'],
      default: 'MONTHLY',
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
  }
);

export const DEFAULT_PLANS = [
  {
    name: 'Free Starter',
    slug: 'free',
    price: 0,
    currency: 'INR',
    appLimit: 1,
    billingPeriod: 'LIFETIME',
    features: ['1 Published Application', 'Standard APK Scanning', 'Community Support'],
    isActive: true,
    displayOrder: 1,
    isDefault: true,
  },
  {
    name: 'Silver Developer',
    slug: 'silver',
    price: 399,
    currency: 'INR',
    appLimit: 5,
    billingPeriod: 'MONTHLY',
    features: [
      'Up to 5 Published Applications',
      'Priority Malware & Trust Scans',
      'Email Support within 24h',
      'Analytics Dashboard',
    ],
    isActive: true,
    displayOrder: 2,
    isDefault: false,
  },
  {
    name: 'Gold Studio',
    slug: 'gold',
    price: 599,
    currency: 'INR',
    appLimit: 10,
    billingPeriod: 'MONTHLY',
    features: [
      'Up to 10 Published Applications',
      'Instant Security Pipeline',
      'Priority Review Queue',
      'Advanced Telemetry & Analytics',
      'Direct Support Agent',
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
    appLimit: 25,
    billingPeriod: 'MONTHLY',
    features: [
      'Up to 25 Applications',
      'Enterprise SLA & Fast-Track Review',
      'Custom Branding & Featured Placement',
      'Dedicated Account Manager',
    ],
    isActive: true,
    displayOrder: 4,
    isDefault: false,
  },
];

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;
