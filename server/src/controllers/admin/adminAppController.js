import { App } from '../../models/App.js';
import { AppVersion } from '../../models/AppVersion.js';
import { SecurityReport } from '../../models/SecurityReport.js';
import { Category } from '../../models/Category.js';
import { AuditLogService } from '../../services/admin/auditLogService.js';
import { NotificationService } from '../../services/admin/notificationService.js';

/**
 * Admin Application Moderation Controller (Phase 7 Production Implementation)
 * Manages platform review queue, approvals, rejections, change requests, and blocking.
 */

/**
 * GET /api/admin/apps
 * Query all platform applications with pagination, search, and status/security filters
 */
export const getAdminApps = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, securityStatus, category, search, platform } = req.query;

    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (platform && platform !== 'ALL') {
      filter.platform = platform;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { packageName: regex }, { slug: regex }];
    }

    const [apps, total] = await Promise.all([
      App.find(filter)
        .populate('developer', 'name email profileImage accountStatus')
        .populate('category', 'name slug')
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      App.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        apps,
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
 * GET /api/admin/apps/:appId
 * Detailed inspection of application, versions, security assessments, and review log
 */
export const getAdminAppById = async (req, res, next) => {
  try {
    const app = await App.findById(req.params.appId)
      .populate('developer', 'name email profileImage accountStatus createdAt')
      .populate('category', 'name slug')
      .populate('currentVersion');

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    // Retrieve full version history
    const versions = await AppVersion.find({
      app: app._id,
      uploadStatus: { $ne: 'DELETED' },
    }).sort({ versionCode: -1, createdAt: -1 });

    // Retrieve security reports associated with app's versions
    const securityReports = await SecurityReport.find({
      app: app._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        app,
        versions,
        securityReports,
        reviewHistory: app.moderation?.reviewHistory || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/apps/:appId/approve
 * Approve application for publishing. Requires valid version & clean security checks.
 */
export const approveApp = async (req, res, next) => {
  try {
    const { notes = '', publishImmediately = true } = req.body;

    const app = await App.findById(req.params.appId).populate('currentVersion');
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // 1. Validate version existence
    let version = app.currentVersion;
    if (!version) {
      // Look for latest completed version
      version = await AppVersion.findOne({
        app: app._id,
        processingStatus: 'COMPLETED',
        uploadStatus: { $ne: 'DELETED' },
      }).sort({ versionCode: -1 });
    }

    if (!version) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve application without a completed APK release version.',
      });
    }

    // 2. Security Checks: Admin approval MUST NOT bypass malicious, quarantined, or tampered APKs
    if (version.quarantined) {
      return res.status(400).json({
        success: false,
        code: 'APK_QUARANTINED',
        message: 'Cannot approve application: active release version is quarantined for security violations.',
      });
    }

    if (version.securityStatus === 'MALICIOUS') {
      return res.status(400).json({
        success: false,
        code: 'MALWARE_DETECTED',
        message: 'Cannot approve application: active release version contains confirmed security threats.',
      });
    }

    if (version.integrityStatus === 'MISMATCH') {
      return res.status(400).json({
        success: false,
        code: 'INTEGRITY_MISMATCH',
        message: 'Cannot approve application: cryptographic binary hash does not match storage bytes.',
      });
    }

    const previousStatus = app.status;
    const newStatus = publishImmediately ? 'PUBLISHED' : 'APPROVED';

    app.status = newStatus;
    app.visibility = 'PUBLIC';
    if (!app.currentVersion) {
      app.currentVersion = version._id;
    }

    // Enable public downloads for version upon approval
    version.downloadStatus = 'ENABLED';
    if (version.securityStatus !== 'PASSED') {
      version.securityStatus = 'APPROVED';
    }
    await version.save();

    // Record moderation history
    if (!app.moderation) app.moderation = { reviewHistory: [] };
    app.moderation.reviewedBy = req.user._id;
    app.moderation.reviewedAt = new Date();
    app.moderation.reviewHistory.push({
      action: 'APPROVED',
      admin: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      reason: notes || 'Application content and security criteria verified and approved.',
      timestamp: new Date(),
    });

    await app.save();

    // Record Immutable Audit Log
    await AuditLogService.log({
      req,
      action: 'APP_APPROVED',
      resourceType: 'APP',
      resourceId: app._id,
      reason: notes,
      previousState: { status: previousStatus },
      newState: { status: newStatus, versionId: version._id },
    });

    return res.status(200).json({
      success: true,
      message: `Application approved and set to ${newStatus}.`,
      data: { app },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/apps/:appId/reject
 * Reject application submission with mandatory reason and category
 */
export const rejectApp = async (req, res, next) => {
  try {
    const { reason, category = 'CONTENT' } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is mandatory.',
      });
    }

    const app = await App.findById(req.params.appId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const previousStatus = app.status;
    app.status = 'REJECTED';
    app.visibility = 'PRIVATE';

    if (!app.moderation) app.moderation = { reviewHistory: [] };
    app.moderation.rejectionCategory = category;
    app.moderation.rejectionReason = reason.trim();
    app.moderation.reviewedBy = req.user._id;
    app.moderation.reviewedAt = new Date();
    app.moderation.reviewHistory.push({
      action: 'REJECTED',
      admin: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      category,
      reason: reason.trim(),
      timestamp: new Date(),
    });

    await app.save();

    // Record Immutable Audit Log
    await AuditLogService.log({
      req,
      action: 'APP_REJECTED',
      resourceType: 'APP',
      resourceId: app._id,
      reason: reason.trim(),
      previousState: { status: previousStatus },
      newState: { status: 'REJECTED', category },
      severity: 'WARNING',
    });

    return res.status(200).json({
      success: true,
      message: 'Application has been rejected.',
      data: { app },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/apps/:appId/request-changes
 * Request changes from the developer with clear actionable instructions
 */
export const requestChanges = async (req, res, next) => {
  try {
    const { reason, notes = '' } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Change request reason is required.',
      });
    }

    const app = await App.findById(req.params.appId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const previousStatus = app.status;
    app.status = 'CHANGES_REQUESTED';
    app.visibility = 'PRIVATE';

    if (!app.moderation) app.moderation = { reviewHistory: [] };
    app.moderation.changesRequestedReason = reason.trim();
    app.moderation.reviewedBy = req.user._id;
    app.moderation.reviewedAt = new Date();
    app.moderation.reviewHistory.push({
      action: 'CHANGES_REQUESTED',
      admin: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      reason: reason.trim(),
      timestamp: new Date(),
    });

    await app.save();

    // Record Immutable Audit Log
    await AuditLogService.log({
      req,
      action: 'APP_CHANGES_REQUESTED',
      resourceType: 'APP',
      resourceId: app._id,
      reason: reason.trim(),
      previousState: { status: previousStatus },
      newState: { status: 'CHANGES_REQUESTED' },
    });

    return res.status(200).json({
      success: true,
      message: 'Changes have been requested from the developer.',
      data: { app },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/apps/:appId/block
 * Block application immediately, removing from public discovery and disabling downloads
 */
export const blockApp = async (req, res, next) => {
  try {
    const { reason, category = 'POLICY_VIOLATION' } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Blocking reason is mandatory.',
      });
    }

    const app = await App.findById(req.params.appId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const previousStatus = app.status;
    app.status = 'BLOCKED';
    app.visibility = 'PRIVATE';

    // Disable downloads for all versions of this blocked app
    await AppVersion.updateMany(
      { app: app._id },
      { $set: { downloadStatus: 'BLOCKED' } }
    );

    if (!app.moderation) app.moderation = { reviewHistory: [] };
    app.moderation.blockCategory = category;
    app.moderation.blockReason = reason.trim();
    app.moderation.reviewedBy = req.user._id;
    app.moderation.reviewedAt = new Date();
    app.moderation.reviewHistory.push({
      action: 'BLOCKED',
      admin: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      category,
      reason: reason.trim(),
      timestamp: new Date(),
    });

    await app.save();

    // Record Immutable Audit Log
    await AuditLogService.log({
      req,
      action: 'APP_BLOCKED',
      resourceType: 'APP',
      resourceId: app._id,
      reason: reason.trim(),
      previousState: { status: previousStatus },
      newState: { status: 'BLOCKED', category },
      severity: 'CRITICAL',
    });

    return res.status(200).json({
      success: true,
      message: 'Application has been blocked and removed from distribution.',
      data: { app },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/apps/:appId/unpublish
 * Unpublish an application back to draft
 */
export const unpublishApp = async (req, res, next) => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const previousStatus = app.status;
    app.status = 'DRAFT';
    app.visibility = 'PRIVATE';

    if (!app.moderation) app.moderation = { reviewHistory: [] };
    app.moderation.reviewHistory.push({
      action: 'UNPUBLISHED',
      admin: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      reason: req.body.reason || 'Unpublished by platform administration.',
      timestamp: new Date(),
    });

    await app.save();

    await AuditLogService.log({
      req,
      action: 'APP_UNPUBLISHED',
      resourceType: 'APP',
      resourceId: app._id,
      previousState: { status: previousStatus },
      newState: { status: 'DRAFT' },
    });

    return res.status(200).json({
      success: true,
      message: 'Application unpublished.',
      data: { app },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getAdminApps,
  getAdminAppById,
  approveApp,
  rejectApp,
  requestChanges,
  blockApp,
  unpublishApp,
};
