import { AppVersion } from '../models/AppVersion.js';
import { SecurityReport } from '../models/SecurityReport.js';
import { SecurityReviewRequest } from '../models/SecurityReviewRequest.js';
import { SecurityAuditLog } from '../models/SecurityAuditLog.js';
import { serializeDeveloperSecurityReport } from '../utils/securitySerializer.js';

/**
 * Developer Security Controller (Phase 6 Production Implementation)
 * Provides authenticated developer access to security reports, scan statuses,
 * and review request workflows.
 */

/**
 * GET /api/developer/apps/:appId/versions/:versionId/security
 * Retrieve comprehensive security report for an application version
 */
export const getSecurityReport = async (req, res, next) => {
  try {
    const version = await AppVersion.findOne({
      _id: req.params.versionId,
      app: req.app._id,
      uploadStatus: { $ne: 'DELETED' },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Application version not found',
      });
    }

    const report = await SecurityReport.findOne({ version: version._id });

    const serialized = serializeDeveloperSecurityReport(report, version, req.app);

    return res.status(200).json({
      success: true,
      data: {
        security: serialized,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/developer/apps/:appId/versions/:versionId/security/status
 * Lightweight endpoint for real-time frontend polling
 */
export const getSecurityStatus = async (req, res, next) => {
  try {
    const version = await AppVersion.findOne({
      _id: req.params.versionId,
      app: req.app._id,
      uploadStatus: { $ne: 'DELETED' },
    }).select('securityStatus processingStatus riskScore riskLevel manualReviewRequired reviewReason quarantined quarantineReason');

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Application version not found',
      });
    }

    // Determine current pipeline stage for UI stepper
    let stage = 0;
    if (version.processingStatus === 'COMPLETED') stage = 1; // Upload & validation done
    if (version.securityStatus === 'SCANNING') stage = 2;
    if (version.securityStatus === 'ANALYZING') stage = 5;
    const isTerminal = [
      'PASSED',
      'SUSPICIOUS',
      'MALICIOUS',
      'PENDING_MANUAL_REVIEW',
      'QUARANTINED',
      'FAILED',
      'APPROVED',
      'BLOCKED',
    ].includes(version.securityStatus);

    if (isTerminal) stage = 8;

    return res.status(200).json({
      success: true,
      data: {
        status: version.securityStatus,
        riskScore: version.riskScore ?? 0,
        riskLevel: version.riskLevel || 'UNKNOWN',
        manualReviewRequired: version.manualReviewRequired,
        reviewReason: version.reviewReason,
        quarantined: version.quarantined,
        quarantineReason: version.quarantineReason,
        stage,
        isTerminal,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/developer/apps/:appId/versions/:versionId/security/request-review
 * Submit a request for manual human review for a flagged or escalated version
 */
export const requestSecurityReview = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A clear explanation (minimum 10 characters) is required to request security review.',
      });
    }

    const version = await AppVersion.findOne({
      _id: req.params.versionId,
      app: req.app._id,
      uploadStatus: { $ne: 'DELETED' },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Application version not found',
      });
    }

    // Check if open request already exists
    const existingRequest = await SecurityReviewRequest.findOne({
      version: version._id,
      status: { $in: ['OPEN', 'IN_REVIEW'] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'A security review request for this version is already pending review.',
      });
    }

    const report = await SecurityReport.findOne({ version: version._id });

    const reviewRequest = await SecurityReviewRequest.create({
      version: version._id,
      app: req.app._id,
      developer: req.user._id,
      report: report?._id || null,
      reason: reason.trim(),
      status: 'OPEN',
    });

    // Update version status to PENDING_MANUAL_REVIEW if not quarantined or malicious
    if (version.securityStatus !== 'QUARANTINED' && version.securityStatus !== 'MALICIOUS') {
      version.securityStatus = 'PENDING_MANUAL_REVIEW';
      version.manualReviewRequired = true;
      version.reviewReason = `Manual review requested by developer: ${reason.trim().slice(0, 100)}`;
      await version.save();
    }

    // Log to audit trail
    try {
      await SecurityAuditLog.create({
        eventType: 'MANUAL_REVIEW_REQUESTED',
        version: version._id,
        app: req.app._id,
        developer: req.user._id,
        actor: { id: req.user._id, role: req.user.role, email: req.user.email },
        metadata: { reason: reason.trim(), reviewRequestId: reviewRequest._id },
      });
    } catch (auditErr) {
      console.error('[DeveloperSecurityController] Audit error:', auditErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Security review request submitted successfully. Our security team will review your application.',
      data: {
        reviewRequest: {
          id: reviewRequest._id,
          status: reviewRequest.status,
          reason: reviewRequest.reason,
          createdAt: reviewRequest.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getSecurityReport,
  getSecurityStatus,
  requestSecurityReview,
};
