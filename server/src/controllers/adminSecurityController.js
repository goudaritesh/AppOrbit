import { SecurityReport } from '../models/SecurityReport.js';
import { SecurityReviewRequest } from '../models/SecurityReviewRequest.js';
import { SecurityAuditLog } from '../models/SecurityAuditLog.js';
import { AppVersion } from '../models/AppVersion.js';
import { App } from '../models/App.js';
import { serializeAdminSecurityReport } from '../utils/securitySerializer.js';
import { securityScanQueue } from '../workers/securityScanQueue.js';

/**
 * Admin Security Controller (Phase 6 Foundation for Phase 7 Moderation)
 * Administrative tools to inspect detailed security reports, manage reviews, and trigger rescans.
 */

/**
 * GET /api/admin/security/reports
 * Query list of security reports with filters
 */
export const getSecurityReports = async (req, res, next) => {
  try {
    const { status, riskLevel, appId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (riskLevel) query.riskLevel = riskLevel;
    if (appId) query.app = appId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [reports, total] = await Promise.all([
      SecurityReport.find(query)
        .populate('app', 'name slug icon')
        .populate('version', 'versionName versionCode fileHash')
        .populate('developer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take),
      SecurityReport.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page, 10),
          limit: take,
          total,
          pages: Math.ceil(total / take),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/security/reports/:reportId
 * Query detailed security report with full audit history
 */
export const getSecurityReportById = async (req, res, next) => {
  try {
    const report = await SecurityReport.findById(req.params.reportId)
      .populate('app')
      .populate('version')
      .populate('developer', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Security report not found',
      });
    }

    const [reviewRequests, auditLogs] = await Promise.all([
      SecurityReviewRequest.find({ version: report.version?._id }).sort({ createdAt: -1 }),
      SecurityAuditLog.find({ version: report.version?._id }).sort({ timestamp: -1 }),
    ]);

    const serialized = serializeAdminSecurityReport(
      report,
      report.version,
      report.app,
      reviewRequests,
      auditLogs
    );

    return res.status(200).json({
      success: true,
      data: {
        report: serialized,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/security/reports/:reportId/review
 * Submit administrative security review verdict
 */
export const submitReviewDecision = async (req, res, next) => {
  try {
    const { decision, adminNotes, reason } = req.body;
    const finalReason = (reason || adminNotes || '').trim();

    if (!['APPROVED', 'REJECTED', 'QUARANTINED', 'ESCALATED', 'FALSE_POSITIVE'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be one of: APPROVED, REJECTED, QUARANTINED, ESCALATED, FALSE_POSITIVE',
      });
    }

    if (['REJECTED', 'QUARANTINED', 'ESCALATED'].includes(decision) && !finalReason) {
      return res.status(400).json({
        success: false,
        message: `A reason is mandatory for decision: ${decision}.`,
      });
    }

    const report = await SecurityReport.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Security report not found',
      });
    }

    const version = await AppVersion.findById(report.version);
    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Associated application version not found',
      });
    }

    // Apply decision to version
    if (decision === 'APPROVED' || decision === 'FALSE_POSITIVE') {
      version.securityStatus = 'APPROVED';
      version.manualReviewRequired = false;
      version.downloadStatus = 'ENABLED';
      report.status = 'APPROVED';
    } else if (decision === 'REJECTED') {
      version.securityStatus = 'BLOCKED';
      version.downloadStatus = 'BLOCKED';
      report.status = 'BLOCKED';
    } else if (decision === 'QUARANTINED') {
      version.securityStatus = 'QUARANTINED';
      version.quarantined = true;
      version.quarantineReason = finalReason || 'Administratively quarantined during security review';
      version.downloadStatus = 'BLOCKED';
      report.status = 'QUARANTINED';
      report.quarantined = true;
      report.quarantineReason = version.quarantineReason;
    } else if (decision === 'ESCALATED') {
      report.status = 'IN_REVIEW';
      report.manualReviewRequired = true;
    }

    report.adminNotes = finalReason;
    await Promise.all([version.save(), report.save()]);

    // Close any open review requests
    await SecurityReviewRequest.updateMany(
      { version: version._id, status: { $in: ['OPEN', 'IN_REVIEW'] } },
      {
        status: decision === 'APPROVED' || decision === 'FALSE_POSITIVE' ? 'APPROVED' : 'REJECTED',
        adminNotes: finalReason,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      }
    );

    // Audit Log
    try {
      await SecurityAuditLog.create({
        eventType: 'ADMIN_REVIEW_DECISION',
        version: version._id,
        app: version.app,
        developer: version.developer,
        actor: { id: req.user._id, role: req.user.role, email: req.user.email },
        metadata: { decision, adminNotes: finalReason },
      });
    } catch (auditErr) {
      console.error('[AdminSecurityController] Audit error:', auditErr);
    }

    return res.status(200).json({
      success: true,
      message: `Security review decision (${decision}) recorded successfully.`,
      data: {
        versionId: version._id,
        securityStatus: version.securityStatus,
        downloadStatus: version.downloadStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/apps/:appId/versions/:versionId/security/rescan
 * Trigger a forced rescan of an APK version
 */
export const triggerRescan = async (req, res, next) => {
  try {
    const version = await AppVersion.findOne({
      _id: req.params.versionId,
      app: req.params.appId,
      uploadStatus: { $ne: 'DELETED' },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Application version not found',
      });
    }

    version.securityStatus = 'PENDING_SCAN';
    await version.save();

    await securityScanQueue.addJob({
      versionId: version._id,
      options: { forced: true },
    });

    try {
      await SecurityAuditLog.create({
        eventType: 'SECURITY_RESCAN_QUEUED',
        version: version._id,
        app: version.app,
        developer: version.developer,
        actor: { id: req.user._id, role: req.user.role, email: req.user.email },
        metadata: { reason: req.body.reason || 'Admin initiated rescan' },
      });
    } catch {}

    return res.status(200).json({
      success: true,
      message: 'Security rescan job queued successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getSecurityReports,
  getSecurityReportById,
  submitReviewDecision,
  triggerRescan,
};
