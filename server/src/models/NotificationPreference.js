import mongoose from 'mongoose';

/**
 * Notification Preference Model (Phase 8 Production Implementation)
 * Configures per-user notification channels and category opt-ins.
 */
const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    email: {
      enabled: { type: Boolean, default: true },
    },
    push: {
      enabled: { type: Boolean, default: true },
    },
    application: {
      type: Boolean,
      default: true,
    },
    payment: {
      type: Boolean,
      default: true,
    },
    subscription: {
      type: Boolean,
      default: true,
    },
    support: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference = mongoose.model(
  'NotificationPreference',
  notificationPreferenceSchema
);
export default NotificationPreference;
