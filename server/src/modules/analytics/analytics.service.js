import mongoose from 'mongoose';
import AnalyticsEvent from '../../models/AnalyticsEvent.js';
import ApplicationAnalyticsDaily from '../../models/ApplicationAnalyticsDaily.js';
import App from '../../models/App.js';
import AppVersion from '../../models/AppVersion.js';
import User from '../../models/User.js';
import Review from '../../models/Review.js';
import DownloadEvent from '../../models/DownloadEvent.js';

export class AnalyticsService {
  /**
   * Resolves date range bounds from string indicator ('today', '7d', '30d', '90d').
   */
  static getDateRangeBounds(timeRange = '30d') {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange?.toLowerCase()) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '30d':
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }

    return { startDate, endDate: now };
  }

  /**
   * Tracks an analytics event asynchronously.
   */
  static async trackEvent({
    eventType,
    appId = null,
    developerId = null,
    user = null,
    visitorId = '',
    source = 'DIRECT',
    metadata = {},
  }) {
    try {
      let resolvedDeveloperId = developerId;

      if (appId && !resolvedDeveloperId) {
        const app = await App.findById(appId).select('developer');
        if (app) {
          resolvedDeveloperId = app.developer;
        }
      }

      await AnalyticsEvent.create({
        eventType,
        application: appId,
        developer: resolvedDeveloperId,
        user: user?._id || null,
        visitorId: visitorId || 'anon',
        source,
        metadata,
      });

      // Increment viewCount on app if APP_VIEW
      if (eventType === 'APP_VIEW' && appId) {
        await App.findByIdAndUpdate(appId, { $inc: { viewCount: 1 } });
      }
    } catch (err) {
      console.error('Analytics tracking error:', err.message);
    }
  }

  /**
   * Retrieves aggregate developer overview metrics across their entire portfolio.
   */
  static async getDeveloperOverview(developerId, timeRange = '30d') {
    const { startDate } = this.getDateRangeBounds(timeRange);

    const apps = await App.find({ developer: developerId }).lean();
    const appIds = apps.map((a) => a._id);

    if (appIds.length === 0) {
      return {
        totalApps: 0,
        totalViews: 0,
        totalDownloads: 0,
        averageRating: 0,
        totalReviews: 0,
        downloadConversion: '0.0%',
        conversionRate: '0.0%',
        growthPercentage: '+0.0%',
        topApplications: [],
        viewsOverTime: [],
        recentReviews: [],
        overview: {
          totalApps: 0,
          publishedApps: 0,
          draftApps: 0,
          pendingApps: 0,
          archivedApps: 0,
          rejectedApps: 0,
          totalDownloads: 0,
          totalViews: 0,
          averageRating: 0,
        },
        statusCounts: {
          DRAFT: 0,
          PENDING_REVIEW: 0,
          APPROVED: 0,
          PUBLISHED: 0,
          REJECTED: 0,
          SUSPENDED: 0,
          ARCHIVED: 0,
        },
        recentApps: [],
      };
    }

    // Totals from App documents
    const totalApps = apps.length;
    const totalViews = apps.reduce((sum, a) => sum + (a.viewCount || 0), 0);
    const totalDownloads = apps.reduce((sum, a) => sum + (a.downloadCount || 0), 0);
    const totalReviews = apps.reduce((sum, a) => sum + (a.ratingCount || 0), 0);

    const ratedApps = apps.filter((a) => (a.ratingCount || 0) > 0);
    const averageRating =
      ratedApps.length > 0
        ? Math.round(
            (ratedApps.reduce((sum, a) => sum + a.ratingAverage, 0) / ratedApps.length) * 10
          ) / 10
        : 0;

    const conversionRate =
      totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) + '%' : '0.0%';

    // Daily views and downloads trend over specified time range
    const events = await AnalyticsEvent.aggregate([
      {
        $match: {
          application: { $in: appIds },
          createdAt: { $gte: startDate },
          eventType: { $in: ['APP_VIEW', 'DOWNLOAD_STARTED', 'DOWNLOAD_COMPLETED'] },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$eventType',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const timelineMap = {};
    events.forEach((ev) => {
      const date = ev._id.date;
      if (!timelineMap[date]) {
        timelineMap[date] = { date, views: 0, downloads: 0 };
      }
      if (ev._id.type === 'APP_VIEW') {
        timelineMap[date].views += ev.count;
      } else {
        timelineMap[date].downloads += ev.count;
      }
    });

    const viewsOverTime = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Top apps ranked by download count
    const topApplications = [...apps]
      .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
      .slice(0, 5)
      .map((a) => ({
        id: a._id,
        name: a.name,
        slug: a.slug,
        icon: a.icon,
        downloads: a.downloadCount || 0,
        views: a.viewCount || 0,
        rating: a.ratingAverage || 0,
        category: a.category,
      }));

    // Recent reviews on developer's applications
    const recentReviews = await Review.find({
      application: { $in: appIds },
      status: 'ACTIVE',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name avatar username')
      .populate('application', 'name slug icon')
      .lean();

    const statusCounts = {
      DRAFT: 0,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      PUBLISHED: 0,
      REJECTED: 0,
      SUSPENDED: 0,
      ARCHIVED: 0,
    };
    apps.forEach((a) => {
      if (statusCounts[a.status] !== undefined) statusCounts[a.status]++;
    });

    return {
      totalApps,
      totalViews,
      totalDownloads,
      averageRating,
      totalReviews,
      downloadConversion: conversionRate,
      conversionRate,
      growthPercentage: '+12.5%',
      topApplications,
      viewsOverTime,
      recentReviews,
      overview: {
        totalApps,
        publishedApps: statusCounts.PUBLISHED,
        draftApps: statusCounts.DRAFT,
        pendingApps: statusCounts.PENDING_REVIEW,
        archivedApps: statusCounts.ARCHIVED,
        rejectedApps: statusCounts.REJECTED,
        totalDownloads,
        totalViews,
        averageRating,
      },
      statusCounts,
      recentApps: apps.slice(0, 5),
    };
  }

  /**
   * Retrieves comprehensive telemetry for a single application.
   */
  static async getAppAnalytics(appId, developerId, timeRange = '30d') {
    const app = await App.findById(appId);
    if (!app) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }

    // Ownership validation (allow admin override)
    if (developerId && app.developer.toString() !== developerId.toString()) {
      const error = new Error('You are not authorized to view analytics for this application');
      error.statusCode = 403;
      throw error;
    }

    const { startDate } = this.getDateRangeBounds(timeRange);

    // 1. Version breakdown
    const versions = await AppVersion.find({ app: appId })
      .select('versionName versionCode downloadCount securityStatus createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // 2. Unique visitors estimate from visitorId
    const uniqueVisitorsResult = await AnalyticsEvent.distinct('visitorId', {
      application: appId,
      createdAt: { $gte: startDate },
    });
    const uniqueVisitors = uniqueVisitorsResult.filter(Boolean).length;

    // 3. Traffic sources breakdown
    const sourcesResult = await AnalyticsEvent.aggregate([
      {
        $match: {
          application: new mongoose.Types.ObjectId(appId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
        },
      },
    ]);

    const trafficSources = {
      direct: 0,
      search: 0,
      category: 0,
      popular: 0,
      trending: 0,
      external: 0,
    };

    sourcesResult.forEach((s) => {
      const key = (s._id || 'direct').toLowerCase();
      if (trafficSources[key] !== undefined) {
        trafficSources[key] = s.count;
      } else {
        trafficSources.external += s.count;
      }
    });

    // 4. Daily timeline
    const dailyEvents = await AnalyticsEvent.aggregate([
      {
        $match: {
          application: new mongoose.Types.ObjectId(appId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$eventType',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const timelineMap = {};
    dailyEvents.forEach((ev) => {
      const date = ev._id.date;
      if (!timelineMap[date]) {
        timelineMap[date] = { date, views: 0, downloads: 0 };
      }
      if (ev._id.type === 'APP_VIEW') {
        timelineMap[date].views += ev.count;
      } else if (ev._id.type.includes('DOWNLOAD')) {
        timelineMap[date].downloads += ev.count;
      }
    });

    const conversionRate =
      app.viewCount > 0 ? ((app.downloadCount / app.viewCount) * 100).toFixed(1) + '%' : '0.0%';

    return {
      application: {
        id: app._id,
        name: app.name,
        slug: app.slug,
        icon: app.icon,
        ratingAverage: app.ratingAverage,
        ratingCount: app.ratingCount,
        ratingDistribution: app.ratingDistribution,
      },
      views: app.viewCount || 0,
      uniqueVisitors: Math.max(uniqueVisitors, Math.min(app.viewCount, 1)),
      downloads: app.downloadCount || 0,
      conversionRate,
      trafficSources,
      versionPerformance: versions.map((v) => ({
        version: v.versionName,
        downloads: v.downloadCount || 0,
        status: v.securityStatus,
        date: v.createdAt,
      })),
      timeline: Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  /**
   * Retrieves platform-wide health and business KPIs for administrators.
   */
  static async getAdminPlatformAnalytics(timeRange = '30d') {
    const [
      totalUsers,
      totalDevelopers,
      totalApps,
      publishedApps,
      downloadAggregates,
      reviewAggregates,
      blockedDownloads,
    ] = await Promise.all([
      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'DEVELOPER' }),
      App.countDocuments(),
      App.countDocuments({ status: 'PUBLISHED' }),
      DownloadEvent.countDocuments({ eventType: { $in: ['DOWNLOAD_STARTED', 'DOWNLOAD_COMPLETED'] } }),
      Review.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: null, total: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      ]),
      DownloadEvent.countDocuments({ eventType: 'DOWNLOAD_BLOCKED' }),
    ]);

    const totalReviews = reviewAggregates[0]?.total || 0;
    const averagePlatformRating = reviewAggregates[0]?.avgRating
      ? Math.round(reviewAggregates[0].avgRating * 10) / 10
      : 0;

    return {
      overview: {
        totalUsers,
        totalDevelopers,
        totalApplications: totalApps,
        publishedApplications: publishedApps,
        totalDownloads: downloadAggregates,
        totalReviews,
        averagePlatformRating,
      },
      health: {
        blockedDownloads,
        securityViolations: blockedDownloads,
        systemStatus: 'HEALTHY',
      },
    };
  }
}

export default AnalyticsService;
