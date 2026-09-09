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
  }
);

paymentSchema.index({ createdAt: -1, status: 1 });
paymentSchema.index({ developer: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
