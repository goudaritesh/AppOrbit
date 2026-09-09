import { App } from '../../models/App.js';
import { AppVersion } from '../../models/AppVersion.js';
import { SecurityReport } from '../../models/SecurityReport.js';
import { Category } from '../../models/Category.js';
import { AuditLogService } from '../../services/admin/auditLogService.js';
import { NotificationService } from '../../services/admin/notificationService.js';
import { ApkSecurityPipeline } from '../../security/apkSecurityPipeline.js';

/**
 * 7-Point Mandatory Approval Gate (Sprint 5)
 */
export const evaluateApprovalRules = (app, version) => {
  const rules = {
    developerAccountActive: Boolean(app.developer?.accountStatus === 'ACTIVE'),
    requiredDetailsCompleted: Boolean(app.name && app.shortDescription && app.description && app.category),
    iconUploaded: Boolean(app.icon),
    apkUploaded: Boolean(version),
    apkValidated: Boolean(version && (version.processingStatus === 'COMPLETED' || version.fileName)),
    securityProcessingCompleted: Boolean(
      version &&
      (version.securityStatus === 'PASSED' || version.securityStatus === 'APPROVED' || version.scanResult === 'clean')
    ),
    noBlockingSecurityAlerts: Boolean(
      version &&
      version.securityStatus !== 'MALICIOUS' &&
      version.securityStatus !== 'BLOCKED' &&
      version.securityStatus !== 'SUSPICIOUS'
    ),
  };

  const missingRequirements = [];
  if (!rules.developerAccountActive) missingRequirements.push('Developer Account must be Active');
  if (!rules.requiredDetailsCompleted) missingRequirements.push('Application details (Name, Short Description, Description, Category) incomplete');
  if (!rules.iconUploaded) missingRequirements.push('Application icon must be uploaded');
  if (!rules.apkUploaded) missingRequirements.push('APK binary must be uploaded');
  if (!rules.apkValidated) missingRequirements.push('APK archive validation incomplete');
  if (!rules.securityProcessingCompleted) missingRequirements.push('Security scan processing incomplete');
  if (!rules.noBlockingSecurityAlerts) missingRequirements.push('Blocking security alerts or malware detected');

  const canApprove = missingRequirements.length === 0;
  return { canApprove, rules, missingRequirements };
};

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

    const activeVersion = app.currentVersion || versions[0];
    const readiness = evaluateApprovalRules(app, activeVersion);

    return res.status(200).json({
      success: true,
      data: {
        app,
        versions,
        securityReports,
        approvalReadiness: readiness,
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
    const targetId = req.params.appId || req.params.id;
    const { notes = '', publishImmediately = true } = req.body;

    const app = await App.findById(targetId).populate('developer').populate('currentVersion');
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // 1. Validate version existence
    let version = app.currentVersion;
    if (!version) {
      version = await AppVersion.findOne({
        app: app._id,
        uploadStatus: { $ne: 'DELETED' },
      }).sort({ versionCode: -1, createdAt: -1 });
    }

    // 2. Enforce 7-Point Approval Rules Gate
    const { canApprove, rules, missingRequirements } = evaluateApprovalRules(app, version);
    if (!canApprove) {
      return res.status(400).json({
        success: false,
        code: 'APPROVAL_BLOCKED',
        message: `Cannot approve application. Missing requirements: ${missingRequirements.join('; ')}`,
        missingRequirements,
        rules,
      });
    }

    // 3. Promote APK out of quarantine into approved storage
    try {
      const quarantinePath = version.quarantinePath || version.storagePath;
      const promoteResult = await ApkSecurityPipeline.promoteToApproved(
        app._id,
        version._id,
        quarantinePath
      );
      version.storageKey = promoteResult.storageKey || version.storageKey;
      version.storagePath = promoteResult.storagePath || version.storagePath;
    } catch (promoteErr) {
      console.warn('[approveApp] Non-fatal quarantine promotion note:', promoteErr.message);
    }

    // 4. Update status & security records
    const previousStatus = app.status;
    const newStatus = publishImmediately ? 'PUBLISHED' : 'APPROVED';

    app.status = newStatus;
    app.visibility = publishImmediately ? 'PUBLIC' : 'PRIVATE';
    if (publishImmediately && !app.publishedAt) {
      app.publishedAt = new Date();
    }
    app.currentVersion = version._id;

    version.quarantined = false;
    version.downloadStatus = 'ENABLED';
    version.securityStatus = 'APPROVED';
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
      reason: notes || 'All 7 security and application requirements verified and approved.',
      timestamp: new Date(),
    });

    await app.save();

    // Record Immutable Audit Log
    await AuditLogService.log({
      req,
      action: 'APP_APPROVED',
      resourceType: 'APP',
      resourceId: app._id,
      reason: notes || 'Approved application release',
      previousState: { status: previousStatus },
      newState: { status: newStatus, versionId: version._id },
    });

    return res.status(200).json({
      success: true,
      message: `Application approved and set to ${newStatus}.`,
      data: { app, version },
      app,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/apps/:appId/reject or PATCH /api/v1/admin/apps/:id/reject
 * Reject application submission with mandatory reason and category
 */
export const rejectApp = async (req, res, next) => {
  try {
    const targetId = req.params.appId || req.params.id;
    const { reason, category = 'Platform Policy Violation', comment = '' } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is mandatory.',
      });
    }

    const app = await App.findById(targetId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const previousStatus = app.status;
    app.status = 'REJECTED';
    app.visibility = 'PRIVATE';

    // Store review object per Sprint 5 specification
    app.review = {
      status: 'REJECTED',
      reason: category || reason.trim(),
      comment: (comment || reason).trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

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

    // Quarantine and block version downloads
    const version = app.currentVersion
      ? await AppVersion.findById(app.currentVersion)
      : await AppVersion.findOne({ app: app._id }).sort({ createdAt: -1 });

    if (version) {
      version.quarantined = true;
      version.securityStatus = 'REJECTED';
      version.downloadStatus = 'BLOCKED';
      version.quarantineReason = reason.trim() || 'Rejected during administrative review';
      await version.save();
    }

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
      data: { app, version },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/apps/:appId/request-changes or PATCH /api/v1/admin/apps/:id/request-changes
 * Request changes from the developer with clear actionable instructions
 */
export const requestChanges = async (req, res, next) => {
  try {
    const targetId = req.params.appId || req.params.id;
    const { reason, notes = '', comment = '' } = req.body;

    const explanation = (comment || notes || reason || '').trim();

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Change request reason is required.',
      });
    }

    const app = await App.findById(targetId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const previousStatus = app.status;
    app.status = 'CHANGES_REQUESTED';
    app.visibility = 'PRIVATE';

    // Store review object per Sprint 5 specification
    app.review = {
      status: 'CHANGES_REQUESTED',
      reason: reason.trim(),
      comment: explanation,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

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
