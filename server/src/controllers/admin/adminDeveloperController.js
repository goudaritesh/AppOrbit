import { User } from '../../models/User.js';
import { App } from '../../models/App.js';
import { Subscription } from '../../models/Subscription.js';
import { Payment } from '../../models/Payment.js';
import { SecurityReport } from '../../models/SecurityReport.js';
import { AuditLogService } from '../../services/admin/auditLogService.js';

/**
 * Admin Developer Management Controller (Phase 7 Production Implementation)
 * Manages developer accounts, status audits, suspension lifecycles, and private admin notes.
 */

/**
 * GET /api/admin/developers
 * Paginated list of developers with application counts and account statuses
 */
export const getAdminDevelopers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, search } = req.query;

    const filter = { role: 'DEVELOPER' };

    if (status && status !== 'ALL') {
      filter.accountStatus = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [developers, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Populate app stats and subscription for each developer in batch
    const developerIds = developers.map((d) => d._id);

    const [appStats, subscriptions] = await Promise.all([
      App.aggregate([
        { $match: { developer: { $in: developerIds } } },
        {
          $group: {
            _id: '$developer',
            totalApps: { $sum: 1 },
            publishedApps: {
              $sum: { $cond: [{ $eq: ['$status', 'PUBLISHED'] }, 1, 0] },
            },
            totalDownloads: { $sum: '$downloadCount' },
          },
        },
      ]),
      Subscription.find({
        developer: { $in: developerIds },
        status: 'ACTIVE',
      }).populate('plan', 'name slug price'),
    ]);

    const statsMap = new Map(appStats.map((s) => [s._id.toString(), s]));
    const subMap = new Map(subscriptions.map((s) => [s.developer.toString(), s]));

    const enriched = developers.map((dev) => {
      const devIdStr = dev._id.toString();
      const stats = statsMap.get(devIdStr) || {
        totalApps: 0,
        publishedApps: 0,
        totalDownloads: 0,
      };
      const sub = subMap.get(devIdStr);

      return {
        ...dev,
        stats,
        subscription: sub
          ? {
              planName: sub.plan?.name || sub.planSlug,
              planSlug: sub.planSlug,
              status: sub.status,
              appsLimit: sub.appsLimit,
            }
          : {
              planName: 'Free Starter',
              planSlug: 'free',
              status: 'ACTIVE',
              appsLimit: 1,
            },
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        developers: enriched,
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
 * GET /api/admin/developers/:developerId
 * Comprehensive developer account dossier: profile, apps, security reports, subscription, payments
 */
export const getAdminDeveloperById = async (req, res, next) => {
  try {
    const developer = await User.findOne({
      _id: req.params.developerId,
      role: 'DEVELOPER',
    })
      .select('-password')
      .populate('adminNotes.author', 'name email');

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer account not found.',
      });
    }

    const [apps, subscription, payments, securityReports] = await Promise.all([
      App.find({ developer: developer._id }).sort({ createdAt: -1 }),
      Subscription.findOne({ developer: developer._id, status: 'ACTIVE' }).populate('plan'),
      Payment.find({ developer: developer._id }).sort({ createdAt: -1 }).limit(10),
      SecurityReport.find({ developer: developer._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        developer,
        apps,
        subscription,
        payments,
        securityReports,
        adminNotes: developer.adminNotes || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/developers/:developerId/suspend
 * Suspend developer account (TEMPORARY or INDEFINITE) with mandatory reason
 */
export const suspendDeveloper = async (req, res, next) => {
  try {
    const { reason, type = 'INDEFINITE', durationDays = 0 } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is mandatory.',
      });
    }

    const developer = await User.findOne({
      _id: req.params.developerId,
      role: 'DEVELOPER',
    });

    if (!developer) {
      return res.status(404).json({ success: false, message: 'Developer account not found.' });
    }

    const previousStatus = developer.accountStatus;
    developer.accountStatus = 'SUSPENDED';
    developer.suspensionType = type;
    developer.suspensionReason = reason.trim();

    if (type === 'TEMPORARY' && durationDays > 0) {
      const until = new Date();
      until.setDate(until.getDate() + parseInt(durationDays, 10));
      developer.suspendedUntil = until;
    } else {
      developer.suspendedUntil = null;
    }

    // Add entry to admin notes
    developer.adminNotes.push({
      note: `Account suspended (${type}): ${reason.trim()}`,
      author: req.user._id,
      createdAt: new Date(),
    });

    await developer.save();

    // Log immutable audit event
    await AuditLogService.log({
      req,
      action: 'DEVELOPER_SUSPENDED',
      resourceType: 'DEVELOPER',
      resourceId: developer._id,
      reason: reason.trim(),
      previousState: { status: previousStatus },
      newState: {
        status: 'SUSPENDED',
        type,
        suspendedUntil: developer.suspendedUntil,
      },
      severity: 'WARNING',
    });

    return res.status(200).json({
      success: true,
      message: `Developer account suspended (${type}).`,
      data: { developer },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/developers/:developerId/restore
 * Restore developer account back to ACTIVE
 */
export const restoreDeveloper = async (req, res, next) => {
  try {
    const developer = await User.findOne({
      _id: req.params.developerId,
      role: 'DEVELOPER',
    });

    if (!developer) {
      return res.status(404).json({ success: false, message: 'Developer account not found.' });
    }

    const previousStatus = developer.accountStatus;
    developer.accountStatus = 'ACTIVE';
    developer.suspensionType = 'NONE';
    developer.suspensionReason = '';
    developer.suspendedUntil = null;
    developer.restrictedFeatures = [];

    developer.adminNotes.push({
      note: `Account restored to ACTIVE by admin.`,
      author: req.user._id,
      createdAt: new Date(),
    });

    await developer.save();

    await AuditLogService.log({
      req,
      action: 'DEVELOPER_RESTORED',
      resourceType: 'DEVELOPER',
      resourceId: developer._id,
      previousState: { status: previousStatus },
      newState: { status: 'ACTIVE' },
    });

    return res.status(200).json({
      success: true,
      message: 'Developer account restored to ACTIVE.',
      data: { developer },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/developers/:developerId/restrict
 * Apply or update operational feature restrictions
 */
export const restrictDeveloper = async (req, res, next) => {
  try {
    const { restrictedFeatures = [] } = req.body;

    const developer = await User.findOne({
      _id: req.params.developerId,
      role: 'DEVELOPER',
    });

    if (!developer) {
      return res.status(404).json({ success: false, message: 'Developer account not found.' });
    }

    developer.restrictedFeatures = restrictedFeatures;
    if (restrictedFeatures.length > 0 && developer.accountStatus === 'ACTIVE') {
      developer.accountStatus = 'RESTRICTED';
    } else if (restrictedFeatures.length === 0 && developer.accountStatus === 'RESTRICTED') {
      developer.accountStatus = 'ACTIVE';
    }

    await developer.save();

    await AuditLogService.log({
      req,
      action: 'DEVELOPER_RESTRICTED',
      resourceType: 'DEVELOPER',
      resourceId: developer._id,
      metadata: { restrictedFeatures },
    });

    return res.status(200).json({
      success: true,
      message: 'Developer feature restrictions updated.',
      data: { developer },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/developers/:developerId/notes
 * Add private administrator note
 */
export const addAdminNote = async (req, res, next) => {
  try {
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required.' });
    }

    const developer = await User.findById(req.params.developerId);
    if (!developer) {
      return res.status(404).json({ success: false, message: 'Developer not found.' });
    }

    developer.adminNotes.push({
      note: note.trim(),
      author: req.user._id,
      createdAt: new Date(),
    });

    await developer.save();

    return res.status(201).json({
      success: true,
      message: 'Admin note added successfully.',
      data: { notes: developer.adminNotes },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getAdminDevelopers,
  getAdminDeveloperById,
  suspendDeveloper,
  restoreDeveloper,
  restrictDeveloper,
  addAdminNote,
};
