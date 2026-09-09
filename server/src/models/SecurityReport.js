import mongoose from 'mongoose';

/**
 * Finding Sub-Schema
 * Structured security finding representing an observation, risk indicator, or threat.
 */
const findingSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'INFO',
    },
    category: {
      type: String,
      enum: [
        'INTEGRITY',
        'MALWARE',
        'SIGNATURE',
        'CERTIFICATE',
        'PERMISSIONS',
        'STATIC_ANALYSIS',
        'IDENTITY',
        'SYSTEM',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    requiresReview: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/**
 * SecurityReport Schema (Phase 6 Production Implementation)
 * Comprehensive, persistent security analysis record for an uploaded APK version artifact.
 */
const securityReportSchema = new mongoose.Schema(
  {
    version: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppVersion',
      required: [true, 'AppVersion reference is required'],
      unique: true,
      index: true,
    },
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
    status: {
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
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN'],
      default: 'UNKNOWN',
      index: true,
    },
    scanStartedAt: {
      type: Date,
      default: null,
    },
    scanCompletedAt: {
      type: Date,
      default: null,
    },
    fileHash: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    hashAlgorithm: {
      type: String,
      default: 'SHA-256',
    },
    packageName: {
      type: String,
      default: '',
      trim: true,
    },
    signatureInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        status: 'UNKNOWN',
        scheme: null,
        signersCount: 0,
        signatureValid: false,
        details: null,
      }),
    },
    certificateInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        sha256Fingerprint: null,
        sha1Fingerprint: null,
        issuer: null,
        subject: null,
        validFrom: null,
        validTo: null,
        algorithm: null,
        certificateChanged: false,
        previousFingerprint: null,
      }),
    },
    permissionAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        permissions: [],
        riskPermissions: [],
        riskScore: 0,
        riskLevel: 'LOW',
        dangerousCombinations: [],
        warnings: [],
      }),
    },
    malwareAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        status: 'undetected',
        detected: false,
        provider: 'none',
        maliciousCount: 0,
        suspiciousCount: 0,
        scanId: null,
        enginesScanned: 0,
        threatNames: [],
        scanDate: null,
      }),
    },
    staticAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        debuggable: false,
        exportedComponentsCount: 0,
        exportedComponents: [],
        nativeLibraries: [],
        suspiciousIndicators: [],
        obfuscationIndicators: [],
        warnings: [],
      }),
    },
    integrityAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        status: 'UNKNOWN',
        originalHash: '',
        verifiedHash: '',
        match: false,
      }),
    },
    identityVerification: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        packageNameValid: true,
        packageMatchesApp: true,
        versionCodeValid: true,
        monotonicCode: true,
      }),
    },
    scannerResults: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    findings: {
      type: [findingSchema],
      default: [],
    },
    warnings: {
      type: [String],
      default: [],
    },
    threats: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
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
    quarantined: {
      type: Boolean,
      default: false,
      index: true,
    },
    quarantineReason: {
      type: String,
      default: null,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    executionTimeMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
securityReportSchema.index({ app: 1, createdAt: -1 });
securityReportSchema.index({ developer: 1, createdAt: -1 });
securityReportSchema.index({ status: 1, riskLevel: 1 });

export const SecurityReport = mongoose.model('SecurityReport', securityReportSchema);
export default SecurityReport;
