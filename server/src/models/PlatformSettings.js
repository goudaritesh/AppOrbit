import mongoose from 'mongoose';

/**
 * Platform Settings Model (Phase 7 Production Implementation)
 * Singleton configuration document for platform operations, policy enforcement, and maintenance mode.
 */
const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'GLOBAL_SETTINGS',
      unique: true,
      index: true,
    },
    general: {
      platformName: { type: String, default: 'AppOrbit' },
      platformDescription: {
        type: String,
        default: 'The trusted Android publishing and distribution platform.',
      },
      supportEmail: { type: String, default: 'support@apporbit.io' },
      contactEmail: { type: String, default: 'contact@apporbit.io' },
      logoUrl: { type: String, default: '/logo.svg' },
    },
    applications: {
      maximumApkSizeMb: { type: Number, default: 200 },
      maximumScreenshotCount: { type: Number, default: 8 },
      reviewRequired: { type: Boolean, default: true },
      autoPublishDisabled: { type: Boolean, default: true },
    },
    security: {
      securityScanEnabled: { type: Boolean, default: true },
      manualReviewThresholdScore: { type: Number, default: 50 },
      quarantineThresholdScore: { type: Number, default: 80 },
      requireSignatureV2: { type: Boolean, default: false },
    },
    payments: {
      manualQrEnabled: { type: Boolean, default: true },
      razorpayEnabled: { type: Boolean, default: false },
      upiId: { type: String, default: 'pay.apporbit@upi' },
    },
    maintenance: {
      enabled: { type: Boolean, default: false, index: true },
      title: { type: String, default: 'AppOrbit Platform Maintenance' },
      message: {
        type: String,
        default: 'AppOrbit is undergoing planned maintenance and updates. We will be back shortly.',
      },
      allowedRoles: {
        type: [String],
        default: ['SUPER_ADMIN', 'ADMIN'],
      },
      startedAt: { type: Date, default: null },
      estimatedEndTime: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
export default PlatformSettings;
