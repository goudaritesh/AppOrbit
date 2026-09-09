/**
 * Security Decision Engine (Phase 6 Production Implementation)
 * Evaluates comprehensive security analysis metrics and applies strict policy rules
 * to determine the final security status and quarantine requirements.
 */
export class SecurityDecisionService {
  /**
   * Determine terminal security status
   */
  static evaluateDecision({
    integrityResult,
    malwareResult,
    signatureResult,
    riskResult,
  }) {
    // 1. Critical Hard Failures (Immediate Quarantine or Block)
    if (!integrityResult.match) {
      return {
        status: 'QUARANTINED',
        quarantined: true,
        quarantineReason: 'Cryptographic SHA-256 integrity digest mismatch between storage and upload record.',
        downloadEligible: false,
      };
    }

    if (malwareResult.detected || malwareResult.maliciousCount > 0) {
      return {
        status: 'MALICIOUS',
        quarantined: true,
        quarantineReason: `Malware signatures detected: ${(malwareResult.threatNames || []).join(', ')}`,
        downloadEligible: false,
      };
    }

    if (signatureResult.status === 'INVALID' || signatureResult.status === 'ERROR') {
      return {
        status: 'BLOCKED',
        quarantined: false,
        quarantineReason: null,
        downloadEligible: false,
      };
    }

    // 2. Scanner Infrastructure Failure -> NEVER mark safe!
    if (malwareResult.status === 'error') {
      return {
        status: 'PENDING_MANUAL_REVIEW',
        quarantined: false,
        quarantineReason: null,
        downloadEligible: false,
      };
    }

    // 3. Suspicious Malware Heuristics
    if (malwareResult.status === 'suspicious') {
      return {
        status: 'SUSPICIOUS',
        quarantined: false,
        quarantineReason: null,
        downloadEligible: false,
      };
    }

    // 4. Elevated Risk or Review Escalation
    if (riskResult.manualReviewRequired || riskResult.riskLevel === 'CRITICAL') {
      return {
        status: 'PENDING_MANUAL_REVIEW',
        quarantined: false,
        quarantineReason: null,
        downloadEligible: false,
      };
    }

    // 5. Clean / Passed Checks
    if (
      integrityResult.match &&
      !malwareResult.detected &&
      malwareResult.status === 'undetected' &&
      (signatureResult.status === 'VALID' || signatureResult.status === 'MULTIPLE_SIGNERS') &&
      riskResult.riskLevel === 'LOW'
    ) {
      return {
        status: 'PASSED',
        quarantined: false,
        quarantineReason: null,
        downloadEligible: true,
      };
    }

    // If moderate risk but no review required
    if (riskResult.riskLevel === 'MEDIUM') {
      return {
        status: 'PASSED',
        quarantined: false,
        quarantineReason: null,
        downloadEligible: true,
      };
    }

    // Fallback safety catch
    return {
      status: 'PENDING_MANUAL_REVIEW',
      quarantined: false,
      quarantineReason: null,
      downloadEligible: false,
    };
  }
}

export default SecurityDecisionService;
