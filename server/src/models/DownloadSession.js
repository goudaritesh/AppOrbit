import mongoose from 'mongoose';

/**
 * Download Session Model (Phase 9 Secure Downloads)
 * Manages short-lived download authorizations and status verification.
 */
const downloadSessionSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: [true, 'Application is required for a download session'],
      index: true,
    },
    version: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppVersion',
      required: [true, 'App version is required for a download session'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    sessionToken: {
      type: String,
      required: [true, 'Session token is required'],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['CREATED', 'STARTED', 'COMPLETED', 'EXPIRED', 'BLOCKED'],
        message: '{VALUE} is not a valid download session status',
      },
      default: 'CREATED',
      index: true,
    },
    ipHash: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '1h' }, // Automatic MongoDB TTL cleanup after expiry
    },
    downloadStartedAt: {
      type: Date,
      default: null,
    },
    downloadCompletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

downloadSessionSchema.index({ application: 1, user: 1, createdAt: -1 });
downloadSessionSchema.index({ ipHash: 1, createdAt: -1 });

export const DownloadSession = mongoose.model('DownloadSession', downloadSessionSchema);
export default DownloadSession;
