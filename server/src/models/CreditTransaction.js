import mongoose from 'mongoose';

/**
 * Credit Transaction Schema
 * Tracks when a developer's publishing credits are added (via plan/addon purchase) 
 * or consumed (via application approval).
 */
const creditTransactionSchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: ['CREDIT_ADDED', 'CREDIT_CONSUMED', 'CREDIT_REFUNDED'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    // If consumed for publishing a specific app
    relatedApp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      default: null,
    },
    // If added due to a specific payment or plan change
    relatedPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    // Previous balance before transaction
    previousBalance: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
    },
    // New balance after transaction
    newBalance: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);
export default CreditTransaction;
