import mongoose from 'mongoose';

/**
 * Payment Receipt Model (Phase 8 Production Implementation)
 * Provides official verifiable payment receipt records with unique sequential numbering.
 */
const paymentReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
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
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    transactionReference: {
      type: String,
      default: '',
    },
    providerPaymentId: {
      type: String,
      default: '',
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    billingDetails: {
      name: String,
      email: String,
      address: String,
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

paymentReceiptSchema.index({ developer: 1, issuedAt: -1 });

/**
 * Generate a unique receipt number: AB-YYYY-NNNNNN
 */
paymentReceiptSchema.statics.generateReceiptNumber = async function () {
  const year = new Date().getFullYear();
  const count = await this.countDocuments();
  const sequence = String(count + 1).padStart(6, '0');
  return `AB-${year}-${sequence}`;
};

export const PaymentReceipt = mongoose.model('PaymentReceipt', paymentReceiptSchema);
export default PaymentReceipt;
