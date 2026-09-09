/**
 * Security Report Serializers (Phase 6 Production Implementation)
 * Enforces strict role-based separation between Developer, Admin, and Public views.
 */

/**
 * Format developer-facing security report
 * Actionable, transparent findings while redacting internal threat intel secrets and admin notes
 */
export const serializeDeveloperSecurityReport = (report, version, app) => {
  if (!report && !version) return null;

  const versionDoc = version || report?.version || {};
  const appDoc = app || report?.app || {};

  return {
    id: report?._id || null,
    versionId: versionDoc._id || versionDoc.id,
    appId: appDoc._id || appDoc.id,
    appName: appDoc.name,
    versionName: versionDoc.versionName,
    versionCode: versionDoc.versionCode,
    packageName: versionDoc.packageName || report?.packageName,
    fileHash: versionDoc.fileHash || report?.fileHash,
    fileSize: versionDoc.fileSize,
    originalFileName: versionDoc.originalFileName,

    // High level status
    status: report?.status || versionDoc.securityStatus || 'NOT_SCANNED',
    riskScore: report?.riskScore ?? versionDoc.riskScore ?? 0,
    riskLevel: report?.riskLevel || versionDoc.riskLevel || 'UNKNOWN',
    scanStartedAt: report?.scanStartedAt || versionDoc.securityScanStartedAt,
    scanCompletedAt: report?.scanCompletedAt || versionDoc.securityScanCompletedAt,
    executionTimeMs: report?.executionTimeMs || 0,

    // Subsystem Summaries
    integrity: {
      status: report?.integrityAnalysis?.status || versionDoc.integrityStatus || 'UNKNOWN',
      match: report?.integrityAnalysis?.match || false,
      algorithm: report?.integrityAnalysis?.algorithm || 'SHA-256',
      verifiedHash: report?.integrityAnalysis?.verifiedHash || versionDoc.fileHash,
    },

    malware: {
      status: report?.malwareAnalysis?.status || 'undetected',
      detected: report?.malwareAnalysis?.detected || false,
      maliciousCount: report?.malwareAnalysis?.maliciousCount || 0,
      suspiciousCount: report?.malwareAnalysis?.suspiciousCount || 0,
      threatNames: report?.malwareAnalysis?.threatNames || [],
      scanDate: report?.malwareAnalysis?.scanDate || report?.scanCompletedAt,
    },

    signature: {
      status: report?.signatureInfo?.status || versionDoc.signatureStatus || 'UNKNOWN',
      scheme: report?.signatureInfo?.scheme || null,
      schemes: report?.signatureInfo?.schemes || [],
      signersCount: report?.signatureInfo?.signersCount || 0,
      signatureValid: report?.signatureInfo?.signatureValid || false,
      details: report?.signatureInfo?.details || null,
    },

    certificate: {
      sha256Fingerprint: report?.certificateInfo?.sha256Fingerprint || versionDoc.certificateInfo?.sha256Fingerprint || null,
      sha1Fingerprint: report?.certificateInfo?.sha1Fingerprint || versionDoc.certificateInfo?.sha1Fingerprint || null,
      issuer: report?.certificateInfo?.issuer || null,
      subject: report?.certificateInfo?.subject || null,
      algorithm: report?.certificateInfo?.algorithm || null,
      validFrom: report?.certificateInfo?.validFrom || null,
      validTo: report?.certificateInfo?.validTo || null,
      certificateChanged: report?.certificateInfo?.certificateChanged || false,
      previousFingerprint: report?.certificateInfo?.previousFingerprint || null,
    },

    permissions: {
      all: report?.permissionAnalysis?.permissions || versionDoc.permissions || [],
      riskPermissions: report?.permissionAnalysis?.riskPermissions || [],
      riskScore: report?.permissionAnalysis?.riskScore || 0,
      riskLevel: report?.permissionAnalysis?.riskLevel || 'LOW',
      dangerousCombinations: report?.permissionAnalysis?.dangerousCombinations || [],
    },

    staticAnalysis: {
      debuggable: report?.staticAnalysis?.debuggable || false,
      exportedComponentsCount: report?.staticAnalysis?.exportedComponentsCount || 0,
      exportedComponents: report?.staticAnalysis?.exportedComponents || [],
      nativeLibraries: report?.staticAnalysis?.nativeLibraries || [],
      architectures: report?.staticAnalysis?.architectures || [],
      suspiciousIndicators: report?.staticAnalysis?.suspiciousIndicators || [],
      obfuscationIndicators: report?.staticAnalysis?.obfuscationIndicators || [],
    },

    // Findings, Warnings & Recommendations
    findings: report?.findings || [],
    warnings: report?.warnings || [],
    threats: report?.threats || [],
    recommendations: report?.recommendations || [],

    // Review Escalation & Quarantine
    manualReviewRequired: report?.manualReviewRequired || versionDoc.manualReviewRequired || false,
    reviewReason: report?.reviewReason || versionDoc.reviewReason || null,
    quarantined: report?.quarantined || versionDoc.quarantined || false,
    quarantineReason: report?.quarantineReason || versionDoc.quarantineReason || null,

    createdAt: report?.createdAt || versionDoc.createdAt,
    updatedAt: report?.updatedAt || versionDoc.updatedAt,
  };
};

/**
 * Format admin-facing security report
 * Full transparency including raw scanner responses and internal admin audit trails
 */
export const serializeAdminSecurityReport = (report, version, app, reviewRequests = [], auditLogs = []) => {
  const base = serializeDeveloperSecurityReport(report, version, app);
  if (!base) return null;

  return {
    ...base,
    scannerResults: report?.scannerResults || [],
    adminNotes: report?.adminNotes || '',
    reviewRequests: reviewRequests.map((r) => ({
      id: r._id,
      reason: r.reason,
      status: r.status,
      adminNotes: r.adminNotes,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
    })),
    auditLogs: auditLogs.map((l) => ({
      id: l._id,
      eventType: l.eventType,
      actor: l.actor,
      metadata: l.metadata,
      timestamp: l.timestamp,
    })),
  };
};

/**
 * Format consumer/public security status
 * Careful, neutral terminology without disclosing internal security scores or threat details
 */
export const serializePublicSecurityStatus = (version) => {
  if (!version) return null;

  const isCompleted = version.securityStatus === 'PASSED' || version.securityStatus === 'APPROVED';

  return {
    status: isCompleted ? 'COMPLETED' : 'PENDING_REVIEW',
    label: isCompleted
      ? 'Security checks completed'
      : 'Security review in progress',
    description: isCompleted
      ? 'Passed AppOrbit automated static security inspection.'
      : 'This release is currently being analyzed by platform safety systems.',
    verifiedAt: version.securityScanCompletedAt || null,
  };
};

export default {
  serializeDeveloperSecurityReport,
  serializeAdminSecurityReport,
  serializePublicSecurityStatus,
};
