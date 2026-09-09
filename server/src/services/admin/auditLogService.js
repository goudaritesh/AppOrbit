import { AuditLog } from '../../models/AuditLog.js';

/**
 * Standardized Immutable Audit Log Service (Phase 7 Production Implementation)
 * Records all sensitive administrative events with forensic traceability.
 */
export class AuditLogService {
  /**
   * Record an immutable audit log entry
   * @param {Object} params
   * @param {Object} params.req - Express request object (optional, for IP/UA/actor extraction)
   * @param {Object|string} [params.actor] - User object or User ID
   * @param {string} [params.actorRole] - User role
   * @param {string} [params.actorEmail] - User email
   * @param {string} params.action - Event action code (e.g. APP_APPROVED, DEVELOPER_SUSPENDED)
   * @param {string} params.resourceType - Resource type (APP, DEVELOPER, USER, PAYMENT, etc.)
   * @param {string|mongoose.Types.ObjectId} params.resourceId - Resource ID
   * @param {string} [params.reason] - Human-provided justification
   * @param {any} [params.previousState] - Previous state snapshot
   * @param {any} [params.newState] - New state snapshot
   * @param {Object} [params.metadata] - Supplemental details
   * @param {string} [params.severity] - 'INFO', 'WARNING', 'CRITICAL'
   * @returns {Promise<Object>} Created AuditLog document
   */
  static async log({
    req = null,
    actor = null,
    actorRole = null,
    actorEmail = '',
    action,
    resourceType,
    resourceId,
    reason = '',
    previousState = null,
    newState = null,
    metadata = {},
    severity = 'INFO',
  }) {
    try {
      const resolvedActor = actor || req?.user?._id;
      const resolvedRole = actorRole || req?.user?.role || 'SYSTEM';
      const resolvedEmail = actorEmail || req?.user?.email || '';

      let ipAddress = '';
      let userAgent = '';

      if (req) {
        ipAddress =
          req.headers['x-forwarded-for']?.split(',')[0] ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          req.ip ||
          '';
        userAgent = req.headers['user-agent'] || '';
      }

      const logDoc = await AuditLog.create({
        actor: resolvedActor,
        actorRole: resolvedRole,
        actorEmail: resolvedEmail,
        action,
        resourceType,
        resourceId,
        reason,
        previousState,
        newState,
        metadata,
        ipAddress,
        userAgent,
        severity,
      });

      return logDoc;
    } catch (err) {
      console.error('[AuditLogService] Failed to record audit log:', err);
      // Non-blocking: Audit failure should not crash primary transaction if DB drops,
      // but should be logged to stderr
      return null;
    }
  }
}

export default AuditLogService;
