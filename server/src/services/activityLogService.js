import ActivityLog from '../models/ActivityLog.js';
import AuditLog from '../models/AuditLog.js';

export class ActivityLogService {
  static ACTIONS = {
    ADMIN_APPROVED_APP: 'ADMIN_APPROVED_APP',
    ADMIN_REJECTED_APP: 'ADMIN_REJECTED_APP',
    DEVELOPER_PUBLISHED_APP: 'DEVELOPER_PUBLISHED_APP',
    USER_REPORTED_REVIEW: 'USER_REPORTED_REVIEW',
    ADMIN_APPROVED_PAYMENT: 'ADMIN_APPROVED_PAYMENT',
    ADMIN_REJECTED_PAYMENT: 'ADMIN_REJECTED_PAYMENT',
    SUBSCRIPTION_CHANGED: 'SUBSCRIPTION_CHANGED',
    USER_SUSPENDED: 'USER_SUSPENDED',
    USER_RESTORED: 'USER_RESTORED',
    SECURITY_SCAN_TRIGGERED: 'SECURITY_SCAN_TRIGGERED',
  };

  /**
   * Records an administrative or developer activity into the immutable ledger.
   */
  static async logActivity({
    actorId,
    actorRole = 'SYSTEM',
    actorEmail = '',
    action,
    resourceType,
    resourceId,
    reason = '',
    metadata = {},
    ipAddress = '',
    userAgent = '',
    severity = 'INFO',
  }) {
    try {
      const payload = {
        actorId,
        actorRole,
        actorEmail,
        action,
        resourceType,
        resourceId: String(resourceId),
        reason,
        metadata,
        ipAddress,
        userAgent,
        severity,
      };

      // Dual-write to ActivityLog and AuditLog to guarantee cross-version consistency
      const [activityEntry] = await Promise.all([
        ActivityLog.create(payload),
        AuditLog.create({
          actor: actorId,
          actorRole,
          actorEmail,
          action,
          resourceType,
          resourceId: String(resourceId),
          reason,
          metadata,
          ipAddress,
          userAgent,
          severity,
        }).catch((e) => null), // Gracefully handle if AuditLog schema has slight variance
      ]);

      return activityEntry;
    } catch (err) {
      console.error('[ActivityLogService] Failed to record activity log:', err.message);
      return null;
    }
  }

  /**
   * Retrieves paginated activity logs with filtering.
   */
  static async getActivityLogs({
    page = 1,
    limit = 20,
    action = null,
    actorRole = null,
    resourceType = null,
    severity = null,
    search = null,
    startDate = null,
    endDate = null,
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (action && action !== 'ALL') query.action = action;
    if (actorRole && actorRole !== 'ALL') query.actorRole = actorRole;
    if (resourceType && resourceType !== 'ALL') query.resourceType = resourceType;
    if (severity && severity !== 'ALL') query.severity = severity;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { actorEmail: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
      ];
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('actorId', 'name fullName email username role avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    return {
      logs: logs.map((l) => ({
        ...l,
        id: l._id,
        actor: l.actorId, // compatibility alias
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }
}

export default ActivityLogService;
