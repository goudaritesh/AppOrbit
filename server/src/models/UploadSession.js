import mongoose from 'mongoose';

/**
 * UploadSession Schema (Phase 5 Production Implementation)
 * Tracks single-purpose short-lived upload tickets for direct or proxied APK uploads.
 * Automatically purges expired sessions via MongoDB TTL index.
 */
const uploadSessionSchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    app: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: true,
      index: true,
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    expectedHash: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['INITIALIZED', 'UPLOADING', 'UPLOADED', 'COMPLETED', 'EXPIRED', 'CANCELLED'],
      default: 'INITIALIZED',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically deleted when expiresAt is reached
    },
  },
  {
    timestamps: true,
  }
);

export const UploadSession = mongoose.model('UploadSession', uploadSessionSchema);
export default UploadSession;
