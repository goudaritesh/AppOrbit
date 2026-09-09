import { AppVersion } from '../../models/AppVersion.js';
import { App } from '../../models/App.js';
import { SecurityReport } from '../../models/SecurityReport.js';
import { SecurityAuditLog } from '../../models/SecurityAuditLog.js';
import { storageService } from '../storage/storageService.js';
import { IntegrityAnalysisService } from './integrityAnalysisService.js';
import { malwareScanService } from './malwareScanService.js';
import { SignatureAnalysisService } from './signatureAnalysisService.js';
import { CertificateAnalysisService } from './certificateAnalysisService.js';
import { PermissionAnalysisService } from './permissionAnalysisService.js';
import { StaticAnalysisService } from './staticAnalysisService.js';
import { PackageIdentityService } from './packageIdentityService.js';
import { RiskScoringService } from './riskScoringService.js';
import { SecurityDecisionService } from './securityDecisionService.js';
import { QuarantineService } from './quarantineService.js';

/**
 * Security Report Orchestrator Service (Phase 6 Production Implementation)
 * Executes the complete sequential security pipeline, compiles findings,
 * determines security verdicts, and manages database state.
 */
export class SecurityReportService {
  /**
   * Run full security inspection for an AppVersion
   * @param {string} versionId - Target version ID
   * @param {Object} [options] - Options (e.g. simulation metadata for testing)
   */
  static async runSecurityScan(versionId, options = {}) {
    const startTime = Date.now();
    const version = await AppVersion.findById(versionId);
    if (!version) {
      throw new Error(`AppVersion not found: ${versionId}`);
    }

    const app = await App.findById(version.app);
    if (!app) {
      throw new Error(`Parent application not found for version: ${versionId}`);
    }

    // Update status to SCANNING
    version.securityStatus = 'SCANNING';
    version.securityScanStartedAt = new Date();
    await version.save();

    // Log scan start
    try {
      await SecurityAuditLog.create({
        eventType: 'APK_SECURITY_SCAN_STARTED',
        version: version._id,
        app: version.app,
        developer: version.developer,
        actor: { role: 'SYSTEM' },
        metadata: { fileHash: version.fileHash, originalFileName: version.originalFileName },
      });
    } catch (auditErr) {
      console.error('[SecurityReportService] Audit log error:', auditErr);
    }

    try {
      // 1. Retrieve APK binary from private storage
      const buffer = await storageService.getApkBuffer({ key: version.storageKey });
      if (!buffer || buffer.length === 0) {
        throw new Error('Retrieved storage object is empty or corrupted');
      }

      // Transition to ANALYZING
      version.securityStatus = 'ANALYZING';
      await version.save();

      // 2. Binary Integrity Analysis
      const integrityResult = IntegrityAnalysisService.verifyIntegrity(
        buffer,
        options.expectedHash || version.fileHash
      );

      // 3. Malware Scanning (Multi-scanner abstraction)
      const malwareResult = await malwareScanService.scanApk(
        buffer,
        version.fileHash,
        options.scanMetadata || {}
      );

      // 4. Signature Scheme Analysis
      const signatureResult = SignatureAnalysisService.analyzeSignature(buffer);

      // 5. Certificate Extraction & Change Detection
      // Fetch latest completed release prior to this version to compare certificate fingerprint
      const priorVersion = await AppVersion.findOne({
        app: version.app,
        _id: { $ne: version._id },
        processingStatus: 'COMPLETED',
        'certificateInfo.sha256Fingerprint': { $exists: true, $ne: null },
      }).sort({ versionCode: -1 });

      const previousFingerprint = priorVersion?.certificateInfo?.sha256Fingerprint || null;
      const certificateResult = CertificateAnalysisService.analyzeCertificate(
        buffer,
        options.previousFingerprint !== undefined ? options.previousFingerprint : previousFingerprint
      );

      // 6. Permission Risk & Dangerous Combination Analysis
      const permissionResult = PermissionAnalysisService.analyzePermissions(version.permissions);

      // 7. Static Inspection without Code Execution
      const staticResult = StaticAnalysisService.analyze(buffer);

      // 8. Package Identity & Monotonic Sequence Check
      const identityResult = await PackageIdentityService.verifyIdentity({
        version,
        appId: version.app,
      });

      // 9. Risk Scoring Engine
      const riskResult = RiskScoringService.calculateRisk({
        integrityResult,
        malwareResult,
        signatureResult,
        certificateResult,
        permissionResult,
        staticResult,
        identityResult,
      });

      // 10. Security Decision Engine
      const decision = SecurityDecisionService.evaluateDecision({
        integrityResult,
        malwareResult,
        signatureResult,
        riskResult,
      });

      const executionTimeMs = Date.now() - startTime;

      // 11. Create or Update SecurityReport Document
      let report = await SecurityReport.findOne({ version: version._id });
      if (!report) {
        report = new SecurityReport({
          version: version._id,
          app: version.app,
          developer: version.developer,
          fileHash: version.fileHash,
        });
      }

      report.status = decision.status;
      report.riskScore = riskResult.riskScore;
      report.riskLevel = riskResult.riskLevel;
      report.scanStartedAt = version.securityScanStartedAt;
      report.scanCompletedAt = new Date();
      report.packageName = version.packageName;

      report.signatureInfo = signatureResult;
      report.certificateInfo = certificateResult;
      report.permissionAnalysis = permissionResult;
      report.malwareAnalysis = malwareResult;
      report.staticAnalysis = staticResult;
      report.integrityAnalysis = integrityResult;
      report.identityVerification = identityResult;

      report.findings = riskResult.findings;
      report.warnings = riskResult.warnings;
      report.threats = riskResult.threats;
      report.recommendations = riskResult.recommendations;

      report.manualReviewRequired = decision.status === 'PENDING_MANUAL_REVIEW' || riskResult.manualReviewRequired;
      report.reviewReason = decision.status === 'PENDING_MANUAL_REVIEW' ? riskResult.reviewReason || 'Manual security review required' : null;

      report.quarantined = decision.quarantined;
      report.quarantineReason = decision.quarantineReason;
      report.executionTimeMs = executionTimeMs;

      await report.save();

      // 12. Update AppVersion Document
      version.securityReport = report._id;
      version.securityStatus = decision.status;
      version.integrityStatus = integrityResult.status;
      version.signatureStatus = signatureResult.status;
      version.riskScore = riskResult.riskScore;
      version.riskLevel = riskResult.riskLevel;
      version.certificateInfo = {
        sha256Fingerprint: certificateResult.sha256Fingerprint,
        sha1Fingerprint: certificateResult.sha1Fingerprint,
        issuer: certificateResult.issuer,
        subject: certificateResult.subject,
        algorithm: certificateResult.algorithm,
      };
      version.manualReviewRequired = report.manualReviewRequired;
      version.reviewReason = report.reviewReason;
      version.securityScanCompletedAt = report.scanCompletedAt;

      // Check quarantine
      if (decision.quarantined) {
        await QuarantineService.quarantineVersion({
          version,
          reason: decision.quarantineReason,
        });
      } else {
        await version.save();
      }

      // Log completion audit
      try {
        await SecurityAuditLog.create({
          eventType: decision.quarantined
            ? 'APK_QUARANTINED'
            : report.manualReviewRequired
            ? 'HIGH_RISK_PERMISSION'
            : 'APK_SECURITY_SCAN_COMPLETED',
          version: version._id,
          app: version.app,
          developer: version.developer,
          actor: { role: 'SYSTEM' },
          metadata: {
            status: decision.status,
            riskScore: riskResult.riskScore,
            riskLevel: riskResult.riskLevel,
            executionTimeMs,
            threatsCount: riskResult.threats.length,
          },
        });
      } catch (auditErr) {
        console.error('[SecurityReportService] Audit error:', auditErr);
      }

      return {
        success: true,
        report,
        version,
      };
    } catch (err) {
      console.error(`[SecurityReportService] Security analysis failed for version ${versionId}:`, err);
      version.securityStatus = 'FAILED';
      version.manualReviewRequired = true;
      version.reviewReason = `Automated scan pipeline failure: ${err.message}`;
      await version.save();

      try {
        await SecurityAuditLog.create({
          eventType: 'APK_SECURITY_SCAN_FAILED',
          version: version._id,
          app: version.app,
          developer: version.developer,
          actor: { role: 'SYSTEM' },
          metadata: { error: err.message },
        });
      } catch {}

      return {
        success: false,
        error: err.message,
        version,
      };
    }
  }
}

export default SecurityReportService;
