import mongoose from 'mongoose';

/**
 * SecurityAuditLog Schema (Phase 6 Production Implementation)
 * Append-only immutable log for all critical security scanning, quarantine, and review events.
 */
const securityAuditLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'APK_SECURITY_SCAN_STARTED',
        'APK_SECURITY_SCAN_COMPLETED',
        'APK_SECURITY_SCAN_FAILED',
        'MALWARE_DETECTED',
        'SIGNATURE_INVALID',
        'INTEGRITY_MISMATCH',
        'CERTIFICATE_CHANGED',
        'HIGH_RISK_PERMISSION',
        'APK_QUARANTINED',
        'MANUAL_REVIEW_REQUESTED',
        'ADMIN_REVIEW_DECISION',
        'SECURITY_RESCAN_QUEUED',
      ],
      index: true,
    },
    version: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppVersion',
      required: true,
      index: true,
    },
    app: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: true,
      index: true,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      role: { type: String, default: 'SYSTEM' },
      email: { type: String, default: null },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

securityAuditLogSchema.index({ app: 1, timestamp: -1 });
securityAuditLogSchema.index({ version: 1, timestamp: -1 });

export const SecurityAuditLog = mongoose.model('SecurityAuditLog', securityAuditLogSchema);
export default SecurityAuditLog;
