import mongoose from 'mongoose';

/**
 * Immutable Audit Log Model (Phase 7 Production Implementation)
 * Append-only ledger recording all administrative and sensitive lifecycle events.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: [
        'APP',
        'VERSION',
        'DEVELOPER',
        'USER',
        'PAYMENT',
        'SUBSCRIPTION',
        'SECURITY',
        'SETTING',
        'SUPPORT',
        'REPORT',
        'ADMIN',
        'REVIEW',
      ],
      required: true,
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      default: '',
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL'],
      default: 'INFO',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // strictly append-only
  }
);

auditLogSchema.index({ createdAt: -1, action: 1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
