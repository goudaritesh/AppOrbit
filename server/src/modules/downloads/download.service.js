import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import App from '../../models/App.js';
import AppVersion from '../../models/AppVersion.js';
import DownloadSession from '../../models/DownloadSession.js';
import DownloadEvent from '../../models/DownloadEvent.js';
import Download from '../../models/Download.js';
import AnalyticsEvent from '../../models/AnalyticsEvent.js';
import EventTrackingService from '../../services/eventTrackingService.js';

export class DownloadService {
  /**
   * Hashes client IP for abuse detection without storing raw PII.
   */
  static hashIp(ip) {
    if (!ip) return '0000000000000000';
    return crypto.createHash('sha256').update(String(ip)).digest('hex').substring(0, 32);
  }

  /**
   * Initiates a secure download session.
   * Performs gatekeeper security status checks before issuing download token.
   */
  static async initiateDownload({ appId, versionId = null, user = null, ip = '', userAgent = '', source = 'MARKETPLACE' }) {
    const ipHash = this.hashIp(ip);

    // 1. Fetch application with developer info (support ObjectId or slug)
    const isObjectId = mongoose.isValidObjectId(appId);
    const app = isObjectId
      ? await App.findById(appId).populate('developer', 'name username isVerified accountStatus')
      : await App.findOne({ slug: appId }).populate('developer', 'name username isVerified accountStatus');

    if (!app) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    const resolvedAppId = app._id;

    // Gatekeeper: App status
    if (['SUSPENDED', 'BLOCKED', 'REMOVED', 'ARCHIVED'].includes(app.status)) {
      await DownloadEvent.create({
        application: resolvedAppId,
        version: app.currentVersion?._id || resolvedAppId,
        user: user?._id || null,
        eventType: 'DOWNLOAD_BLOCKED',
        blockedReason: `APPLICATION_${app.status}`,
        ipHash,
        source,
      });

      const error = new Error(`Application is currently ${app.status.toLowerCase()} and cannot be downloaded.`);
      error.statusCode = 403;
      error.code = app.status === 'SUSPENDED' ? 'APP_SUSPENDED' : `APPLICATION_${app.status}`;
      throw error;
    }

    if (app.status !== 'PUBLISHED') {
      const error = new Error('Application is not published yet.');
      error.statusCode = 403;
      throw error;
    }

    // 2. Fetch specific or latest published version
    let version;
    if (versionId && mongoose.isValidObjectId(versionId)) {
      version = await AppVersion.findOne({ _id: versionId, app: resolvedAppId });
    } else if (app.currentVersion && mongoose.isValidObjectId(app.currentVersion)) {
      version = await AppVersion.findById(app.currentVersion);
    }

    if (!version) {
      version = await AppVersion.findOne({ app: resolvedAppId, status: 'PUBLISHED' }).sort({ createdAt: -1 });
    }

    if (!version) {
      const error = new Error('No approved downloadable version available for this application.');
      error.statusCode = 404;
      throw error;
    }

    // Gatekeeper: APK Security Status
    if (
      version.securityStatus === 'QUARANTINED' ||
      version.securityStatus === 'FAILED' ||
      version.downloadStatus === 'BLOCKED'
    ) {
      await DownloadEvent.create({
        application: resolvedAppId,
        version: version._id,
        user: user?._id || null,
        eventType: 'DOWNLOAD_BLOCKED',
        blockedReason: `SECURITY_STATUS_${version.securityStatus}`,
        ipHash,
        source,
      });

      const error = new Error(
        'This APK version has not passed security checks or is quarantined. Downloads are blocked for user protection.'
      );
      error.statusCode = 403;
      error.code = 'APK_SECURITY_BLOCKED';
      throw error;
    }

    // 3. Abuse Protection: Check recent session requests from this IP (max 20 per 5 mins)
    const recentRequests = await DownloadSession.countDocuments({
      ipHash,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    });

    if (recentRequests > 25) {
      const error = new Error('Too many download requests in a short period. Please try again in 5 minutes.');
      error.statusCode = 429;
      throw error;
    }

    // 4. Generate unique secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 min validity

    const session = await DownloadSession.create({
      application: resolvedAppId,
      version: version._id,
      user: user?._id || null,
      sessionToken,
      status: 'CREATED',
      ipHash,
      userAgent: userAgent ? userAgent.substring(0, 200) : '',
      expiresAt,
    });

    // 5. Track DOWNLOAD_REQUESTED event
    await DownloadEvent.create({
      application: resolvedAppId,
      version: version._id,
      user: user?._id || null,
      session: session._id,
      eventType: 'DOWNLOAD_REQUESTED',
      userType: user ? user.role || 'USER' : 'ANONYMOUS',
      source,
      ipHash,
    });

    return {
      sessionToken,
      sessionId: session._id,
      downloadUrl: `/api/downloads/file/${sessionToken}`,
      expiresIn: 300,
      expiresAt,
      application: {
        id: app._id,
        name: app.name,
        slug: app.slug,
        icon: app.icon,
        developer: {
          id: app.developer?._id,
          name: app.developer?.name || 'Verified Developer',
        },
      },
      version: {
        id: version._id,
        versionName: version.versionName,
        versionCode: version.versionCode,
        fileSize: version.fileSize || 'N/A',
        fileSizeBytes: version.fileSizeBytes || 0,
        sha256: version.sha256 || 'Pending Verification',
        securityStatus: version.securityStatus || 'PASSED',
        releaseDate: version.createdAt,
      },
    };
  }

  /**
   * Starts a download from an authorized session token.
   * Increments download count only once per session.
   */
  static async startDownload({ sessionToken, ip = '' }) {
    const session = await DownloadSession.findOne({ sessionToken })
      .populate('application')
      .populate('version');

    if (!session) {
      const error = new Error('Invalid download session.');
      error.statusCode = 404;
      throw error;
    }

    if (new Date() > new Date(session.expiresAt)) {
      session.status = 'EXPIRED';
      await session.save();
      const error = new Error('Download session has expired. Please request a new download.');
      error.statusCode = 410;
      throw error;
    }

    if (session.status === 'BLOCKED') {
      const error = new Error('This download session has been blocked.');
      error.statusCode = 403;
      throw error;
    }

    const isFirstStart = session.status === 'CREATED';

    if (isFirstStart) {
      session.status = 'STARTED';
      session.downloadStartedAt = new Date();
      await session.save();

      // Atomically increment download count on Application & Version
      await Promise.all([
        App.findByIdAndUpdate(session.application._id, { $inc: { downloadCount: 1 } }),
        AppVersion.findByIdAndUpdate(session.version._id, { $inc: { downloadCount: 1 } }),
        DownloadEvent.create({
          application: session.application._id,
          version: session.version._id,
          user: session.user,
          session: session._id,
          eventType: 'DOWNLOAD_STARTED',
          ipHash: this.hashIp(ip),
        }),
        Download.create({
          appId: session.application._id,
          versionId: session.version._id,
          userId: session.user || null,
          downloadedAt: new Date(),
          ipHash: this.hashIp(ip),
          userAgent: session.userAgent || '',
        }).catch((err) => console.warn('[Download] Non-fatal log note:', err.message)),
        AnalyticsEvent.create({
          eventType: 'DOWNLOAD_STARTED',
          application: session.application._id,
          developer: session.application.developer,
          user: session.user,
          source: 'DIRECT',
        }),
      ]);
    }

    return session;
  }

  /**
   * Marks a download as completed by client.
   */
  static async completeDownload({ sessionToken }) {
    const session = await DownloadSession.findOne({ sessionToken });
    if (!session) {
      const error = new Error('Download session not found');
      error.statusCode = 404;
      throw error;
    }

    if (session.status !== 'COMPLETED') {
      session.status = 'COMPLETED';
      session.downloadCompletedAt = new Date();
      await session.save();

      await Promise.all([
        DownloadEvent.create({
          application: session.application,
          version: session.version,
          user: session.user,
          session: session._id,
          eventType: 'DOWNLOAD_COMPLETED',
          ipHash: session.ipHash,
        }),
        AnalyticsEvent.create({
          eventType: 'DOWNLOAD_COMPLETED',
          application: session.application,
          user: session.user,
        }),
        EventTrackingService.trackAppDownload(session.application, {
          userId: session.user,
          versionId: session.version,
          metadata: { sessionId: session._id },
        }),
      ]);
    }

    return { success: true, message: 'Download marked as completed' };
  }

  /**
   * Fetches an authenticated user's download history.
   */
  static async getUserDownloadHistory(userId, { page = 1, limit = 15 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const query = {
      user: userId,
      eventType: { $in: ['DOWNLOAD_STARTED', 'DOWNLOAD_COMPLETED'] },
    };

    const [events, total] = await Promise.all([
      DownloadEvent.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('application', 'name slug icon shortDescription ratingAverage downloadCount category')
        .populate('version', 'versionName versionCode fileSize sha256 createdAt')
        .lean(),
      DownloadEvent.countDocuments(query),
    ]);

    // Distinct format for frontend list
    const history = events.map((ev) => ({
      eventId: ev._id,
      downloadedAt: ev.createdAt,
      eventType: ev.eventType,
      application: ev.application,
      version: ev.version,
    }));

    return {
      history,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }
}

export default DownloadService;
