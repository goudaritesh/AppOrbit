import { PlatformReport } from '../../models/PlatformReport.js';
import { App } from '../../models/App.js';
import { AppVersion } from '../../models/AppVersion.js';
import { AuditLogService } from '../../services/admin/auditLogService.js';

/**
 * Admin Community Reports Controller (Phase 7 Production Implementation)
 * Manages user/developer filed violations, copyright claims, malware flags, and resolutions.
 */

/**
 * GET /api/admin/reports
 * Query platform reports with pagination and status/category filters
 */
export const getPlatformReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, category, targetType } = req.query;
    const filter = {};

    if (status && status !== 'ALL') filter.status = status;
    if (category && category !== 'ALL') filter.category = category;
    if (targetType && targetType !== 'ALL') filter.targetType = targetType;

    const [reports, total] = await Promise.all([
      PlatformReport.find(filter)
        .populate('reporter', 'name email')
        .populate('assignedTo', 'name email')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PlatformReport.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/reports/:reportId
 * Query single report details with targeted entity resolution
 */
export const getPlatformReportById = async (req, res, next) => {
  try {
    const report = await PlatformReport.findById(req.params.reportId)
      .populate('reporter', 'name email profileImage')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    let targetEntity = null;
    if (report.targetType === 'APP') {
      targetEntity = await App.findById(report.targetId).populate('developer', 'name email');
    }

    return res.status(200).json({
      success: true,
      data: {
        report,
        targetEntity,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/reports/:reportId/resolve
 * Resolve or dismiss report, with optional direct application blocking
 */
export const resolveReport = async (req, res, next) => {
  try {
    const { status = 'RESOLVED', resolutionNotes = '', blockTarget = false } = req.body;

    const report = await PlatformReport.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const previousStatus = report.status;
    report.status = status;
    report.resolutionNotes = resolutionNotes;
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();

    await report.save();

    // If blockTarget is flagged and target is an APP, immediately block the app
    if (blockTarget && report.targetType === 'APP') {
      const app = await App.findById(report.targetId);
      if (app) {
        app.status = 'BLOCKED';
        app.visibility = 'PRIVATE';
        if (!app.moderation) app.moderation = { reviewHistory: [] };
        app.moderation.blockCategory = report.category;
        app.moderation.blockReason = `Blocked during report resolution: ${resolutionNotes}`;
        app.moderation.reviewHistory.push({
          action: 'BLOCKED',
          admin: req.user._id,
          adminName: req.user.name,
          adminEmail: req.user.email,
          category: report.category,
          reason: resolutionNotes,
          timestamp: new Date(),
        });
        await app.save();

        await AppVersion.updateMany(
          { app: app._id },
          { $set: { downloadStatus: 'BLOCKED' } }
        );

        await AuditLogService.log({
          req,
          action: 'APP_BLOCKED_VIA_REPORT',
          resourceType: 'APP',
          resourceId: app._id,
          reason: resolutionNotes,
          metadata: { reportId: report._id },
          severity: 'CRITICAL',
        });
      }
    }

    await AuditLogService.log({
      req,
      action: 'PLATFORM_REPORT_RESOLVED',
      resourceType: 'REPORT',
      resourceId: report._id,
      previousState: { status: previousStatus },
      newState: { status, resolutionNotes, blockTarget },
    });

    return res.status(200).json({
      success: true,
      message: `Report marked as ${status}.`,
      data: { report },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getPlatformReports,
  getPlatformReportById,
  resolveReport,
};
