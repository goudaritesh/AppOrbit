import { PlatformReport } from '../../models/PlatformReport.js';
import { AppReport } from '../../models/AppReport.js';
import { App } from '../../models/App.js';
import { AppVersion } from '../../models/AppVersion.js';
import { AuditLogService } from '../../services/admin/auditLogService.js';

/**
 * Admin Community Reports Controller (Phase 7 & Sprint 5 Production Implementation)
 * Manages user/developer filed violations, copyright claims, malware flags, and resolutions.
 */

/**
 * GET /api/v1/admin/reports or /api/admin/reports
 * Query platform and app reports with pagination and status/category filters
 */
export const getPlatformReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, category } = req.query;
    const filter = {};

    if (status && status !== 'ALL') filter.status = status;

    const [appReports, platformReports, totalAppReports, totalPlatformReports] = await Promise.all([
      AppReport.find(filter)
        .populate({
          path: 'appId',
          select: 'name slug icon developer status category',
          populate: { path: 'developer', select: 'name email accountStatus' },
        })
        .populate('reportedBy', 'name email profileImage')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
      PlatformReport.find(filter)
        .populate('reporter', 'name email profileImage')
        .populate('assignedTo', 'name email')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
      AppReport.countDocuments(filter),
      PlatformReport.countDocuments(filter),
    ]);

    // Normalize app reports into common structure
    const normalizedAppReports = appReports.map((r) => ({
      _id: r._id,
      id: r._id,
      type: 'APP_REPORT',
      app: r.appId,
      reportedApp: r.appId,
      reporter: r.reportedBy,
      reportedBy: r.reportedBy,
      reason: r.reason,
      category: r.reason,
      description: r.description,
      status: r.status,
      resolutionNotes: r.resolutionNotes,
      reviewedBy: r.reviewedBy,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    // Normalize platform reports
    const normalizedPlatformReports = platformReports.map((r) => ({
      _id: r._id,
      id: r._id,
      type: 'PLATFORM_REPORT',
      targetType: r.targetType,
      targetId: r.targetId,
      reporter: r.reporter,
      reportedBy: r.reporter,
      reason: r.category,
      category: r.category,
      description: r.description,
      status: r.status,
      resolutionNotes: r.resolutionNotes,
      resolvedBy: r.resolvedBy,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    const combined = [...normalizedAppReports, ...normalizedPlatformReports].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const total = totalAppReports + totalPlatformReports;
    const paginated = combined.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      data: {
        reports: paginated,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/reports/:reportId
 * Query single report details with targeted entity resolution
 */
export const getPlatformReportById = async (req, res, next) => {
  try {
    const reportId = req.params.reportId || req.params.id;

    // Check AppReport first
    let appReport = await AppReport.findById(reportId)
      .populate({
        path: 'appId',
        populate: { path: 'developer', select: 'name email accountStatus' },
      })
      .populate('reportedBy', 'name email profileImage')
      .populate('reviewedBy', 'name email');

    if (appReport) {
      return res.status(200).json({
        success: true,
        data: {
          report: {
            ...appReport.toObject(),
            type: 'APP_REPORT',
            reporter: appReport.reportedBy,
            reportedApp: appReport.appId,
          },
          targetEntity: appReport.appId,
        },
      });
    }

    // Otherwise check PlatformReport
    const report = await PlatformReport.findById(reportId)
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
        report: {
          ...report.toObject(),
          type: 'PLATFORM_REPORT',
        },
        targetEntity,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/reports/:id or POST /api/admin/reports/:reportId/resolve
 * Update report status (OPEN, UNDER_REVIEW, RESOLVED, DISMISSED) with optional app suspension
 */
export const updateReportStatus = async (req, res, next) => {
  try {
    const reportId = req.params.reportId || req.params.id;
    const {
      status = 'RESOLVED',
      resolutionNotes = '',
      reason = '',
      suspendApp = false,
      blockTarget = false,
    } = req.body;

    const notes = resolutionNotes || reason;
    const shouldSuspend = suspendApp || blockTarget;

    // Check AppReport
    const appReport = await AppReport.findById(reportId);
    if (appReport) {
      const previousStatus = appReport.status;
      appReport.status = status;
      appReport.resolutionNotes = notes;
      appReport.reviewedBy = req.user._id;
      if (['RESOLVED', 'DISMISSED'].includes(status)) {
        appReport.resolvedAt = new Date();
      }
      await appReport.save();

      if (shouldSuspend && appReport.appId) {
        const app = await App.findById(appReport.appId);
        if (app) {
          app.status = 'SUSPENDED';
          app.visibility = 'PRIVATE';
          if (!app.moderation) app.moderation = { reviewHistory: [] };
          app.moderation.reviewHistory.push({
            action: 'SUSPENDED',
            admin: req.user._id,
            adminName: req.user.name,
            adminEmail: req.user.email,
            reason: `Suspended via report resolution: ${notes}`,
            timestamp: new Date(),
          });
          await app.save();

          await AppVersion.updateMany(
            { app: app._id },
            { $set: { downloadStatus: 'BLOCKED', quarantined: true } }
          );

          await AuditLogService.log({
            req,
            action: 'APP_SUSPENDED_VIA_REPORT',
            resourceType: 'APP',
            resourceId: app._id,
            reason: notes,
            metadata: { reportId: appReport._id },
            severity: 'CRITICAL',
          });
        }
      }

      await AuditLogService.log({
        req,
        action: 'APP_REPORT_UPDATED',
        resourceType: 'REPORT',
        resourceId: appReport._id,
        previousState: { status: previousStatus },
        newState: { status, resolutionNotes: notes, suspendApp: shouldSuspend },
      });

      return res.status(200).json({
        success: true,
        message: `Report marked as ${status}.`,
        data: { report: appReport },
      });
    }

    // Check PlatformReport
    const platformReport = await PlatformReport.findById(reportId);
    if (platformReport) {
      const previousStatus = platformReport.status;
      platformReport.status = status;
      platformReport.resolutionNotes = notes;
      platformReport.resolvedBy = req.user._id;
      platformReport.resolvedAt = new Date();
      await platformReport.save();

      if (shouldSuspend && platformReport.targetType === 'APP') {
        const app = await App.findById(platformReport.targetId);
        if (app) {
          app.status = 'SUSPENDED';
          app.visibility = 'PRIVATE';
          if (!app.moderation) app.moderation = { reviewHistory: [] };
          app.moderation.reviewHistory.push({
            action: 'SUSPENDED',
            admin: req.user._id,
            adminName: req.user.name,
            adminEmail: req.user.email,
            category: platformReport.category,
            reason: `Suspended via report resolution: ${notes}`,
            timestamp: new Date(),
          });
          await app.save();

          await AppVersion.updateMany(
            { app: app._id },
            { $set: { downloadStatus: 'BLOCKED', quarantined: true } }
          );

          await AuditLogService.log({
            req,
            action: 'APP_SUSPENDED_VIA_REPORT',
            resourceType: 'APP',
            resourceId: app._id,
            reason: notes,
            metadata: { reportId: platformReport._id },
            severity: 'CRITICAL',
          });
        }
      }

      await AuditLogService.log({
        req,
        action: 'PLATFORM_REPORT_RESOLVED',
        resourceType: 'REPORT',
        resourceId: platformReport._id,
        previousState: { status: previousStatus },
        newState: { status, resolutionNotes: notes, suspendApp: shouldSuspend },
      });

      return res.status(200).json({
        success: true,
        message: `Report marked as ${status}.`,
        data: { report: platformReport },
      });
    }

    return res.status(404).json({ success: false, message: 'Report not found.' });
  } catch (err) {
    next(err);
  }
};

export const resolveReport = updateReportStatus;

export default {
  getPlatformReports,
  getPlatformReportById,
  resolveReport,
  updateReportStatus,
};
