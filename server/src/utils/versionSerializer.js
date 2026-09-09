/**
 * Version Serializer Module (Phase 5 Protection)
 * Serializes internal AppVersion documents for developer views while shielding
 * private storage keys, physical disk paths, and cloud provider credentials.
 */

export const serializeDeveloperVersion = (version) => {
  if (!version) return null;

  const raw = version.toObject ? version.toObject() : version;

  return {
    id: raw._id ? raw._id.toString() : raw.id,
    appId: raw.app ? (raw.app._id ? raw.app._id.toString() : raw.app.toString()) : null,
    versionName: raw.versionName || '0.0.0',
    versionCode: raw.versionCode || 1,
    releaseNotes: raw.releaseNotes || '',
    originalFileName: raw.originalFileName || '',
    fileSize: raw.fileSize || 0,
    fileHash: raw.fileHash || '',
    hashAlgorithm: raw.hashAlgorithm || 'SHA-256',
    packageName: raw.packageName || '',
    minSdkVersion: raw.minSdkVersion || null,
    targetSdkVersion: raw.targetSdkVersion || null,
    applicationLabel: raw.applicationLabel || '',
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    uploadStatus: raw.uploadStatus || 'PENDING',
    processingStatus: raw.processingStatus || 'PENDING',
    securityStatus: raw.securityStatus || 'PENDING_SCAN',
    integrityStatus: raw.integrityStatus || 'UNKNOWN',
    signatureStatus: raw.signatureStatus || 'UNKNOWN',
    riskScore: raw.riskScore ?? null,
    riskLevel: raw.riskLevel || 'UNKNOWN',
    quarantined: Boolean(raw.quarantined),
    quarantineReason: raw.quarantineReason || null,
    manualReviewRequired: Boolean(raw.manualReviewRequired),
    reviewReason: raw.reviewReason || null,
    securityScanStartedAt: raw.securityScanStartedAt || null,
    securityScanCompletedAt: raw.securityScanCompletedAt || null,
    downloadStatus: raw.downloadStatus || 'DISABLED',
    isCurrent: Boolean(raw.isCurrent),
    processingError: raw.processingError || null,
    metadataExtractedAt: raw.metadataExtractedAt || null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

export const serializeDeveloperVersionList = (versions) => {
  if (!Array.isArray(versions)) return [];
  return versions.map(serializeDeveloperVersion);
};

export default {
  serializeDeveloperVersion,
  serializeDeveloperVersionList,
};
