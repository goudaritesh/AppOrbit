import { AuditLog } from '../../models/AuditLog.js';

/**
 * Admin Audit Log Controller (Phase 7 Production Implementation)
 * Provides strictly read-only, paginated access to forensic administrative logs.
 */

/**
 * GET /api/admin/audit-logs
 * Query immutable audit ledger with filters
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const { action, resourceType, actorRole, severity, startDate, endDate } = req.query;
    const filter = {};

    if (action && action !== 'ALL') filter.action = action;
    if (resourceType && resourceType !== 'ALL') filter.resourceType = resourceType;
    if (actorRole && actorRole !== 'ALL') filter.actorRole = actorRole;
    if (severity && severity !== 'ALL') filter.severity = severity;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs,
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

export default {
  getAuditLogs,
};
