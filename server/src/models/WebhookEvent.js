import mongoose from 'mongoose';

/**
 * Webhook Event Ledger (Phase 8 Production Implementation)
 * Stores immutable incoming webhook payloads, signature digests, and guarantees idempotency.
 */
const webhookEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['RAZORPAY', 'STRIPE', 'OTHER'],
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    payloadHash: {
      type: String,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED'],
      default: 'RECEIVED',
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

webhookEventSchema.index({ createdAt: -1 });

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
export default WebhookEvent;
