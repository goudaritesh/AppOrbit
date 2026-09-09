import mongoose from 'mongoose';

/**
 * Payment Model (Phase 8 Production Implementation)
 * Tracks Razorpay orders, manual QR receipts, UPI intents, and idempotent verification audits.
 */
const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    provider: {
      type: String,
      enum: ['RAZORPAY', 'MANUAL_QR', 'ADMIN_MANUAL', 'OTHER'],
      default: 'RAZORPAY',
      index: true,
    },
    method: {
      type: String,
      enum: ['RAZORPAY', 'UPI', 'MANUAL_QR', 'BANK_TRANSFER', 'OTHER'],
      default: 'RAZORPAY',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'CREATED',
        'PENDING',
        'PROCESSING',
        'SUCCESS',
        'FAILED',
        'REFUNDED',
        'CANCELLED',
        'MANUAL_REVIEW',
      ],
      default: 'CREATED',
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    providerOrderId: {
      type: String,
      default: '',
      index: true,
    },
    providerPaymentId: {
      type: String,
      default: '',
      index: true,
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    receiptNumber: {
      type: String,
      default: '',
    },
    screenshotUrl: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
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
paymentSchema.virtual('developerId').get(function () {
  return this.developer;
});

paymentSchema.virtual('subscriptionId').get(function () {
  return this.subscription;
});

paymentSchema.virtual('planId').get(function () {
  return this.plan;
});

paymentSchema.virtual('paymentMethod').get(function () {
  return this.method;
}).set(function (val) {
  this.method = val;
});

paymentSchema.virtual('paymentGateway').get(function () {
  return this.provider;
}).set(function (val) {
  this.provider = val;
});

paymentSchema.virtual('gatewayOrderId').get(function () {
  return this.providerOrderId || this.razorpayOrderId;
}).set(function (val) {
  this.providerOrderId = val;
  this.razorpayOrderId = val;
});

paymentSchema.virtual('gatewayPaymentId').get(function () {
  return this.providerPaymentId || this.razorpayPaymentId;
}).set(function (val) {
  this.providerPaymentId = val;
  this.razorpayPaymentId = val;
});

paymentSchema.index({ createdAt: -1, status: 1 });
paymentSchema.index({ developer: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
