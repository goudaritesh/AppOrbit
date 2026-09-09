/**
 * Risk Scoring Service (Phase 6 Production Implementation)
 * Combines findings from all analysis subsystems into a normalized risk score (0-100)
 * and evaluates policy thresholds for human review escalation.
 */
export class RiskScoringService {
  /**
   * Calculate overall risk score and compile structured findings
   */
  static calculateRisk({
    integrityResult,
    malwareResult,
    signatureResult,
    certificateResult,
    permissionResult,
    staticResult,
    identityResult,
  }) {
    let score = 0;
    const findings = [];
    const warnings = [];
    const threats = [];
    const recommendations = [];
    let manualReviewRequired = false;
    let reviewReason = null;

    // 1. Malware Scan Assessment
    if (malwareResult.detected || malwareResult.maliciousCount > 0) {
      score += 100;
      threats.push(...(malwareResult.threatNames || ['Malicious signature detected by security scanner']));
      findings.push({
        code: 'MALWARE_DETECTED',
        severity: 'CRITICAL',
        category: 'MALWARE',
        message: `Malware signatures detected (${(malwareResult.threatNames || []).join(', ')})`,
        requiresReview: false,
      });
      recommendations.push('Remove malicious code or third-party SDKs before attempting re-submission.');
    } else if (malwareResult.status === 'suspicious' || malwareResult.suspiciousCount > 0) {
      score += 35;
      warnings.push('Suspicious heuristics identified by security scanners.');
      findings.push({
        code: 'SUSPICIOUS_MALWARE_HEURISTICS',
        severity: 'HIGH',
        category: 'MALWARE',
        message: 'Scanner flagged suspicious behaviors or potentially unwanted software (PUP).',
        requiresReview: true,
      });
      manualReviewRequired = true;
      reviewReason = 'Suspicious heuristic matches detected by automated scanners.';
    } else if (malwareResult.status === 'error') {
      score += 25;
      warnings.push(`Malware scanner was unable to complete inspection: ${malwareResult.error || 'Scanner unavailable'}`);
      findings.push({
        code: 'SCANNER_UNAVAILABLE',
        severity: 'MEDIUM',
        category: 'MALWARE',
        message: 'Malware scanning engine did not return a conclusive verdict due to connectivity/infrastructure failure.',
        requiresReview: true,
      });
      manualReviewRequired = true;
      reviewReason = 'Scanner infrastructure was unavailable during automated analysis.';
    }

    // 2. Binary Integrity Assessment
    if (!integrityResult.match) {
      score += 100;
      threats.push('Storage binary hash does not match original upload hash.');
      findings.push({
        code: 'INTEGRITY_MISMATCH',
        severity: 'CRITICAL',
        category: 'INTEGRITY',
        message: 'Binary digest mismatch detected between storage artifact and upload digest.',
        requiresReview: false,
      });
      recommendations.push('Re-upload the intact APK artifact to ensure file was not corrupted in transit.');
    }

    // 3. Signature Assessment
    if (signatureResult.status === 'UNSIGNED') {
      score += 50;
      warnings.push('APK is unsigned. Unsigned applications cannot be installed on standard Android devices.');
      findings.push({
        code: 'UNSIGNED_APK',
        severity: 'HIGH',
        category: 'SIGNATURE',
        message: 'No cryptographic signature found in APK archive.',
        requiresReview: true,
      });
      recommendations.push('Sign your APK using apksigner or Android Studio release keystore.');
      manualReviewRequired = true;
      reviewReason = reviewReason || 'APK is unsigned.';
    } else if (signatureResult.status === 'INVALID' || signatureResult.status === 'ERROR') {
      score += 80;
      threats.push('APK cryptographic signature headers are corrupted or invalid.');
      findings.push({
        code: 'INVALID_SIGNATURE',
        severity: 'CRITICAL',
        category: 'SIGNATURE',
        message: signatureResult.details || 'Invalid signature scheme in APK.',
        requiresReview: false,
      });
    }

    // 4. Certificate Assessment
    if (certificateResult.certificateChanged) {
      score += 25;
      warnings.push('The signing certificate differs from the certificate used in previous versions of this application.');
      findings.push({
        code: 'CERTIFICATE_CHANGED',
        severity: 'MEDIUM',
        category: 'CERTIFICATE',
        message: `Signing certificate changed from previous release (${certificateResult.previousFingerprint?.slice(0, 14)}... -> ${certificateResult.sha256Fingerprint?.slice(0, 14)}...).`,
        requiresReview: true,
      });
      recommendations.push('If you rotated your release keystore intentionally, request manual review to verify ownership.');
      manualReviewRequired = true;
      reviewReason = reviewReason || 'Signing certificate changed from previous release.';
    }

    // 5. Permission Assessment
    if (permissionResult) {
      // Add portion of permission score (scaled 0-30)
      const scaledPermScore = Math.round((permissionResult.riskScore / 100) * 30);
      score += scaledPermScore;

      if (permissionResult.criticalCount > 0) {
        permissionResult.riskPermissions
          .filter((p) => p.risk === 'CRITICAL')
          .forEach((p) => {
            findings.push({
              code: 'CRITICAL_PERMISSION',
              severity: 'HIGH',
              category: 'PERMISSIONS',
              message: `Application requests critical privileged permission: ${p.permission}`,
              requiresReview: true,
            });
            manualReviewRequired = true;
            reviewReason = reviewReason || `Application requests critical permission (${p.permission}).`;
          });
      }

      if (permissionResult.dangerousCombinations && permissionResult.dangerousCombinations.length > 0) {
        permissionResult.dangerousCombinations.forEach((comb) => {
          score += 15;
          findings.push({
            code: comb.id,
            severity: comb.severity,
            category: 'PERMISSIONS',
            message: `${comb.name}: ${comb.description}`,
            requiresReview: comb.severity === 'CRITICAL',
          });
          if (comb.severity === 'CRITICAL') {
            manualReviewRequired = true;
            reviewReason = reviewReason || comb.description;
          }
        });
      }

      if (permissionResult.warnings) {
        warnings.push(...permissionResult.warnings);
      }
    }

    // 6. Static Analysis Assessment
    if (staticResult) {
      if (staticResult.debuggable) {
        score += 20;
        findings.push({
          code: 'DEBUGGABLE_APK',
          severity: 'MEDIUM',
          category: 'STATIC_ANALYSIS',
          message: 'Application has android:debuggable enabled in manifest.',
          requiresReview: false,
        });
        recommendations.push('Disable android:debuggable before generating production release artifacts.');
      }

      if (staticResult.suspiciousIndicators && staticResult.suspiciousIndicators.length > 0) {
        score += 25;
        staticResult.suspiciousIndicators.forEach((ind) => {
          findings.push({
            code: 'SUSPICIOUS_STATIC_INDICATOR',
            severity: 'HIGH',
            category: 'STATIC_ANALYSIS',
            message: ind,
            requiresReview: true,
          });
          warnings.push(ind);
        });
        manualReviewRequired = true;
        reviewReason = reviewReason || 'Suspicious embedded indicators detected in APK.';
      }

      if (staticResult.warnings) {
        warnings.push(...staticResult.warnings);
      }
    }

    // 7. Identity & Version Progression
    if (identityResult) {
      if (!identityResult.packageMatchesApp) {
        score += 40;
        findings.push({
          code: 'PACKAGE_IDENTITY_MISMATCH',
          severity: 'HIGH',
          category: 'IDENTITY',
          message: identityResult.reason || 'Package name does not match application identity.',
          requiresReview: true,
        });
        warnings.push('Package identifier mismatch detected.');
        manualReviewRequired = true;
        reviewReason = reviewReason || 'Package identifier mismatch detected.';
      }

      if (!identityResult.monotonicCode) {
        score += 30;
        findings.push({
          code: 'VERSION_CODE_REGRESSION',
          severity: 'HIGH',
          category: 'IDENTITY',
          message: `Version code (${identityResult.highestPreviousCode}) has decreased in this release.`,
          requiresReview: false,
        });
        warnings.push(`Version code is lower than previously released build (${identityResult.highestPreviousCode}).`);
      }
    }

    // Clamp score to 0 - 100
    const finalScore = Math.min(100, Math.max(0, score));

    // Thresholds
    const lowMax = parseInt(process.env.SECURITY_RISK_LOW_MAX, 10) || 20;
    const medMax = parseInt(process.env.SECURITY_RISK_MEDIUM_MAX, 10) || 50;
    const highMax = parseInt(process.env.SECURITY_RISK_HIGH_MAX, 10) || 75;

    let riskLevel = 'LOW';
    if (finalScore > highMax) riskLevel = 'CRITICAL';
    else if (finalScore > medMax) riskLevel = 'HIGH';
    else if (finalScore > lowMax) riskLevel = 'MEDIUM';

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      manualReviewRequired = true;
      reviewReason = reviewReason || `Elevated risk level (${riskLevel}) requires security review.`;
    }

    // Clean recommendations and warnings (deduplicate)
    const uniqueWarnings = Array.from(new Set(warnings));
    const uniqueRecommendations = Array.from(new Set(recommendations));
    const uniqueThreats = Array.from(new Set(threats));

    return {
      riskScore: finalScore,
      riskLevel,
      findings,
      warnings: uniqueWarnings,
      threats: uniqueThreats,
      recommendations: uniqueRecommendations,
      manualReviewRequired,
      reviewReason,
    };
  }
}

export default RiskScoringService;
