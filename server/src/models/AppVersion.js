import mongoose from 'mongoose';

/**
 * AppVersion Schema (Phase 5 Production Implementation)
 * Manages immutable APK release artifacts, binary file metadata, cryptographic integrity,
 * extracted Android manifest parameters, and security lifecycle status.
 */
const appVersionSchema = new mongoose.Schema(
  {
    app: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: [true, 'Parent application reference is required'],
      index: true,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Developer reference is required'],
      index: true,
    },
    versionName: {
      type: String,
      required: [true, 'Version name is required (e.g., 1.0.0)'],
      trim: true,
      maxlength: [50, 'Version name cannot exceed 50 characters'],
    },
    versionCode: {
      type: Number,
      default: 0,
    },
    releaseNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Release notes cannot exceed 5,000 characters'],
    },
    fileName: {
      type: String,
      required: [true, 'Internal sanitized file name is required'],
      trim: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: [0, 'File size cannot be negative'],
    },
    fileHash: {
      type: String,
      required: [true, 'Cryptographic file hash is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    sha256: {
      type: String,
      trim: true,
      lowercase: true,
      default: function () {
        return this.fileHash;
      },
    },
    hashAlgorithm: {
      type: String,
      default: 'SHA-256',
      trim: true,
    },
    storageProvider: {
      type: String,
      enum: ['local-private', 's3', 'r2'],
      default: 'local-private',
    },
    storageKey: {
      type: String,
      required: [true, 'Private storage key is required'],
      trim: true,
    },
    storagePath: {
      type: String,
      default: '',
      trim: true,
    },
    contentType: {
      type: String,
      default: 'application/vnd.android.package-archive',
      trim: true,
    },
    packageName: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    minSdkVersion: {
      type: Number,
      default: null,
    },
    targetSdkVersion: {
      type: Number,
      default: null,
    },
    applicationLabel: {
      type: String,
      default: '',
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    certificateInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    uploadStatus: {
      type: String,
      enum: ['PENDING', 'UPLOADING', 'UPLOADED', 'FAILED', 'DELETED'],
      default: 'PENDING',
      index: true,
    },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    securityStatus: {
      type: String,
      enum: [
        'NOT_SCANNED',
        'PENDING_SCAN',
        'SCANNING',
        'ANALYZING',
        'PASSED',
        'SUSPICIOUS',
        'MALICIOUS',
        'PENDING_MANUAL_REVIEW',
        'QUARANTINED',
        'FAILED',
        'APPROVED',
        'BLOCKED',
      ],
      default: 'PENDING_SCAN',
      index: true,
    },
    integrityStatus: {
      type: String,
      enum: ['VALID', 'MISMATCH', 'FAILED', 'UNKNOWN'],
      default: 'UNKNOWN',
      index: true,
    },
    signatureStatus: {
      type: String,
      enum: ['VALID', 'INVALID', 'UNSIGNED', 'MULTIPLE_SIGNERS', 'UNKNOWN', 'ERROR'],
      default: 'UNKNOWN',
      index: true,
    },
    riskScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN'],
      default: 'UNKNOWN',
      index: true,
    },
    securityReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SecurityReport',
      default: null,
    },
    quarantined: {
      type: Boolean,
      default: false,
      index: true,
    },
    quarantineReason: {
      type: String,
      default: null,
    },
    quarantinedAt: {
      type: Date,
      default: null,
    },
    quarantinedStorageKey: {
      type: String,
      default: null,
    },
    manualReviewRequired: {
      type: Boolean,
      default: false,
      index: true,
    },
    reviewReason: {
      type: String,
      default: null,
    },
    securityScanStartedAt: {
      type: Date,
      default: null,
    },
    securityScanCompletedAt: {
      type: Date,
      default: null,
    },
    downloadStatus: {
      type: String,
      enum: ['DISABLED', 'PENDING_APPROVAL', 'ENABLED', 'BLOCKED'],
      default: 'DISABLED',
      index: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
    processingError: {
      code: { type: String, default: null },
      message: { type: String, default: null },
      details: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    metadataExtractedAt: {
      type: Date,
      default: null,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Only completed versions enforce unique version codes per app
appVersionSchema.index(
  { app: 1, versionCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      versionCode: { $gt: 0 },
      processingStatus: 'COMPLETED',
      uploadStatus: { $ne: 'DELETED' },
    },
  }
);

// Compound Indexes for fast dashboard and version querying
appVersionSchema.index({ app: 1, isCurrent: 1 });
appVersionSchema.index({ app: 1, createdAt: -1 });
appVersionSchema.index({ developer: 1, createdAt: -1 });
appVersionSchema.index({ app: 1, processingStatus: 1 });

export const AppVersion = mongoose.model('AppVersion', appVersionSchema);
export default AppVersion;
