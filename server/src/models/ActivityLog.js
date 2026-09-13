import mongoose from 'mongoose';

/**
 * Activity Log Model (Sprint 10 Audit Logging System)
 * Immutable audit trail for accountability, security, and administrative actions.
 */
const activityLogSchema = new mongoose.Schema(
  {
    actorId: {
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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
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
    timestamps: { createdAt: true, updatedAt: false }, // Strictly append-only
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field alias: actor -> actorId
activityLogSchema.virtual('actor')
  .get(function () { return this.actorId; })
  .set(function (val) { this.actorId = val; });

activityLogSchema.index({ createdAt: -1, action: 1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1 });
activityLogSchema.index({ actorId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
