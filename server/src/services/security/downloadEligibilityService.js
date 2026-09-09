/**
 * Download Eligibility Gatekeeper (Phase 6 Production Implementation)
 * Central policy authority governing whether an APK artifact can be downloaded
 * by public consumers or developer owners.
 */
export class DownloadEligibilityService {
  /**
   * Check eligibility for public download
   * @param {Object} version - AppVersion document
   * @param {Object} [app] - Parent App document
   * @returns {{ eligible: boolean, code?: string, reason?: string }}
   */
  static isPublicDownloadEligible(version, app = null) {
    if (!version) {
      return { eligible: false, code: 'VERSION_NOT_FOUND', reason: 'Application version does not exist.' };
    }

    if (version.quarantined) {
      return { eligible: false, code: 'QUARANTINED', reason: 'This version has been quarantined for security reasons.' };
    }

    if (version.processingStatus !== 'COMPLETED') {
      return { eligible: false, code: 'PROCESSING_INCOMPLETE', reason: 'Version binary processing is incomplete.' };
    }

    if (version.securityStatus !== 'PASSED' && version.securityStatus !== 'APPROVED') {
      return { eligible: false, code: 'SECURITY_CHECK_PENDING', reason: 'This version has not passed platform security verification.' };
    }

    if (version.integrityStatus !== 'VALID') {
      return { eligible: false, code: 'INTEGRITY_INVALID', reason: 'Cryptographic binary integrity check is invalid.' };
    }

    if (version.signatureStatus !== 'VALID' && version.signatureStatus !== 'MULTIPLE_SIGNERS') {
      return { eligible: false, code: 'SIGNATURE_INVALID', reason: 'Cryptographic signature is missing or invalid.' };
    }

    if (version.downloadStatus !== 'ENABLED') {
      return { eligible: false, code: 'DOWNLOADS_DISABLED', reason: 'Public downloads for this version are currently disabled.' };
    }

    if (app && app.status === 'BLOCKED') {
      return { eligible: false, code: 'APP_BLOCKED', reason: 'Application has been blocked by platform administration.' };
    }

    if (app && app.status !== 'PUBLISHED') {
      return { eligible: false, code: 'APP_NOT_PUBLISHED', reason: 'Application is not currently published.' };
    }

    return { eligible: true };
  }

  /**
   * Check eligibility for developer owner inspection download
   * Developers may inspect pending/review versions, but NEVER quarantined, malicious, or blocked files
   * @param {Object} version - AppVersion document
   * @param {Object} [app] - Parent App document
   * @returns {{ eligible: boolean, code?: string, reason?: string }}
   */
  static isDeveloperDownloadEligible(version, app = null) {
    if (!version) {
      return { eligible: false, code: 'VERSION_NOT_FOUND', reason: 'Application version not found.' };
    }

    if (app && app.status === 'BLOCKED') {
      return { eligible: false, code: 'APP_BLOCKED', reason: 'Application has been blocked by platform administration.' };
    }

    if (version.quarantined) {
      return { eligible: false, code: 'QUARANTINED', reason: 'This version is quarantined due to safety violations and cannot be retrieved.' };
    }

    if (version.securityStatus === 'MALICIOUS') {
      return { eligible: false, code: 'MALWARE_DETECTED', reason: 'This version contains detected threats and cannot be downloaded.' };
    }

    if (version.securityStatus === 'BLOCKED') {
      return { eligible: false, code: 'BLOCKED', reason: 'This version has been blocked by security policy.' };
    }

    if (version.integrityStatus === 'MISMATCH') {
      return { eligible: false, code: 'INTEGRITY_MISMATCH', reason: 'File integrity failure: storage bytes do not match expected hash.' };
    }

    return { eligible: true };
  }
}

export default DownloadEligibilityService;
