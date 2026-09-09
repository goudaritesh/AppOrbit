import mongoose from 'mongoose';

/**
 * Device Token Model (Phase 8 Production Implementation)
 * Stores FCM registration tokens for web push and mobile push notifications.
 */
const deviceTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['WEB', 'ANDROID', 'IOS'],
      default: 'WEB',
    },
    deviceInfo: {
      userAgent: { type: String, default: '' },
      ipAddress: { type: String, default: '' },
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

deviceTokenSchema.index({ user: 1, platform: 1 });

export const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);
export default DeviceToken;
