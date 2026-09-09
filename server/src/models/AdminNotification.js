import mongoose from 'mongoose';

/**
 * Admin Notification Model (Phase 7 Production Implementation)
 * In-app alert center for critical platform events, moderation alerts, and security incidents.
 */
const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'NEW_APP_SUBMITTED',
        'SECURITY_REVIEW_REQUIRED',
        'MALWARE_DETECTED',
        'NEW_PAYMENT_PENDING',
        'NEW_SUPPORT_TICKET',
        'HIGH_PRIORITY_REPORT',
        'DEVELOPER_SUSPENDED',
        'SYSTEM_ALERT',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
      default: 'NORMAL',
      index: true,
    },
    resourceType: {
      type: String,
      default: '',
    },
    resourceId: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

adminNotificationSchema.index({ createdAt: -1, isRead: 1 });

export const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);
export default AdminNotification;
