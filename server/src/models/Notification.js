import mongoose from 'mongoose';

/**
 * User & Developer Notification Model (Phase 8 Production Implementation)
 * In-app alert repository with severity prioritization and unread tracking.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'APP_SUBMITTED',
        'APP_APPROVED',
        'APP_REJECTED',
        'APP_CHANGES_REQUESTED',
        'APP_BLOCKED',
        'APP_PUBLISHED',
        'APK_SECURITY_COMPLETED',
        'APK_SECURITY_FAILED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'PAYMENT_PENDING_REVIEW',
        'SUBSCRIPTION_ACTIVATED',
        'SUBSCRIPTION_EXPIRING',
        'SUBSCRIPTION_EXPIRED',
        'PLAN_UPGRADED',
        'PLAN_DOWNGRADE_SCHEDULED',
        'SUPPORT_REPLY',
        'SUPPORT_TICKET_UPDATED',
        'ADMIN_ALERT',
        'SYSTEM',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
      default: 'NORMAL',
      index: true,
    },
    actionUrl: {
      type: String,
      default: '',
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
