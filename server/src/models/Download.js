import mongoose from 'mongoose';

/**
 * Download Model (Sprint 6 Public Marketplace Download Tracking)
 * Tracks user download events with privacy-preserving telemetry and abuse prevention.
 */
const downloadSchema = new mongoose.Schema(
  {
    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: [true, 'Application ID is required'],
      index: true,
    },
    versionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppVersion',
      required: [true, 'AppVersion ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipHash: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

downloadSchema.index({ appId: 1, downloadedAt: -1 });
downloadSchema.index({ ipHash: 1, downloadedAt: -1 });

export const Download = mongoose.model('Download', downloadSchema);
export default Download;
