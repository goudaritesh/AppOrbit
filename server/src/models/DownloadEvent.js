import mongoose from 'mongoose';

/**
 * Download Event Model (Phase 9 Enhanced Implementation)
 * Records granular download telemetry, verified download proof, and abuse metrics.
 */
const downloadEventSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: true,
      index: true,
    },
    version: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppVersion',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DownloadSession',
      default: null,
    },
    eventType: {
      type: String,
      enum: {
        values: [
          'DOWNLOAD_REQUESTED',
          'DOWNLOAD_STARTED',
          'DOWNLOAD_COMPLETED',
          'DOWNLOAD_BLOCKED',
        ],
        message: '{VALUE} is not a valid download event type',
      },
      default: 'DOWNLOAD_STARTED',
      index: true,
    },
    userType: {
      type: String,
      enum: ['ANONYMOUS', 'USER', 'DEVELOPER', 'ADMIN'],
      default: 'ANONYMOUS',
    },
    source: {
      type: String,
      default: 'MARKETPLACE',
    },
    country: {
      type: String,
      default: 'IN',
    },
    ipHash: {
      type: String,
      default: '',
    },
    blockedReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

downloadEventSchema.index({ application: 1, createdAt: -1 });
downloadEventSchema.index({ user: 1, eventType: 1, createdAt: -1 });
downloadEventSchema.index({ application: 1, user: 1, eventType: 1 });
downloadEventSchema.index({ eventType: 1, createdAt: -1 });

export const DownloadEvent = mongoose.model('DownloadEvent', downloadEventSchema);
export default DownloadEvent;
