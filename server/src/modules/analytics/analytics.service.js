import mongoose from 'mongoose';
import AnalyticsEvent from '../../models/AnalyticsEvent.js';
import ApplicationAnalyticsDaily from '../../models/ApplicationAnalyticsDaily.js';
import DailyAnalytics from '../../models/DailyAnalytics.js';
import App from '../../models/App.js';
import AppVersion from '../../models/AppVersion.js';
import User from '../../models/User.js';
import Review from '../../models/Review.js';
import DownloadEvent from '../../models/DownloadEvent.js';
import Payment from '../../models/Payment.js';
import Subscription from '../../models/Subscription.js';
import SubscriptionPlan from '../../models/SubscriptionPlan.js';
import SearchHistory from '../../models/SearchHistory.js';

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

    const activeSubscription = await Subscription.findOne({
      developer: developerId,
      status: 'ACTIVE',
    })
      .populate('plan', 'name tier publishingCredits appLimit')
      .lean();

    return {
      activeSubscription,
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
    const { startDate } = this.getDateRangeBounds(timeRange);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalDevelopers,
      totalApps,
      publishedApps,
      pendingApps,
      downloadAggregates,
      reviewAggregates,
      revenueResult,
      monthRevenueResult,
      activeSubscriptions,
      blockedDownloads,
    ] = await Promise.all([
      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'DEVELOPER' }),
      App.countDocuments(),
      App.countDocuments({ status: 'PUBLISHED' }),
      App.countDocuments({ status: 'PENDING_REVIEW' }),
      DownloadEvent.countDocuments({
        eventType: { $in: ['DOWNLOAD_STARTED', 'DOWNLOAD_COMPLETED', 'APP_DOWNLOADED'] },
      }),
      Review.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: null, total: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'SUCCESS', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Subscription.countDocuments({ status: 'ACTIVE' }),
      DownloadEvent.countDocuments({ eventType: 'DOWNLOAD_BLOCKED' }),
    ]);

    const totalReviews = reviewAggregates[0]?.total || 0;
    const averagePlatformRating = reviewAggregates[0]?.avgRating
      ? Math.round(reviewAggregates[0].avgRating * 10) / 10
      : 0;
    const totalRevenue = revenueResult[0]?.total || 0;
    const revenueThisMonth = monthRevenueResult[0]?.total || 0;

    return {
      overview: {
        totalUsers,
        totalDevelopers,
        totalApplications: totalApps,
        totalApps,
        publishedApplications: publishedApps,
        publishedApps,
        pendingApplications: pendingApps,
        pendingApps,
        totalDownloads: downloadAggregates,
        totalReviews,
        averagePlatformRating,
        totalRevenue,
        revenueThisMonth,
        activeSubscriptions,
      },
      health: {
        blockedDownloads,
        securityViolations: blockedDownloads,
        systemStatus: 'HEALTHY',
      },
    };
  }

  /**
   * Priority 5: Revenue Analytics Module (Integrates with Sprint 8 Payment Data)
   */
  static async getRevenueAnalytics(timeRange = '30d') {
    const { startDate } = this.getDateRangeBounds(timeRange);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalRevenueResult,
      monthRevenueResult,
      planBreakdownResult,
      successfulPaymentsCount,
      failedPaymentsCount,
      activeSubscriptionsCount,
      revenueTimelineResult,
    ] = await Promise.all([
      // Total Revenue
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Revenue This Month
      Payment.aggregate([
        { $match: { status: 'SUCCESS', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Revenue By Plan
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        {
          $lookup: {
            from: 'subscriptionplans',
            localField: 'plan',
            foreignField: '_id',
            as: 'planDoc',
          },
        },
        { $unwind: { path: '$planDoc', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $toUpper: { $ifNull: ['$planDoc.tier', '$planDoc.name', 'UNKNOWN'] } },
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Payment.countDocuments({ status: 'SUCCESS' }),
      Payment.countDocuments({ status: { $in: ['FAILED', 'CANCELLED'] } }),
      Subscription.countDocuments({ status: 'ACTIVE' }),
      // Timeline in range
      Payment.aggregate([
        { $match: { status: 'SUCCESS', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amount' },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const revenueThisMonth = monthRevenueResult[0]?.total || 0;

    // Standardize plans breakdown (Free ₹0, Silver, Gold, Diamond)
    const planBreakdown = {
      FREE: { name: 'Free Trial', amount: 0, count: 0 },
      SILVER: { name: 'Silver Developer', amount: 0, count: 0 },
      GOLD: { name: 'Gold Studio', amount: 0, count: 0 },
      DIAMOND: { name: 'Diamond Enterprise', amount: 0, count: 0 },
    };

    planBreakdownResult.forEach((item) => {
      const key = (item._id || '').toUpperCase();
      if (key.includes('SILVER')) {
        planBreakdown.SILVER.amount += item.totalRevenue;
        planBreakdown.SILVER.count += item.count;
      } else if (key.includes('GOLD')) {
        planBreakdown.GOLD.amount += item.totalRevenue;
        planBreakdown.GOLD.count += item.count;
      } else if (key.includes('DIAMOND')) {
        planBreakdown.DIAMOND.amount += item.totalRevenue;
        planBreakdown.DIAMOND.count += item.count;
      } else if (key.includes('FREE')) {
        planBreakdown.FREE.count += item.count;
      }
    });

    const revenueTimeline = revenueTimelineResult.map((r) => ({
      date: r._id,
      revenue: r.revenue,
      transactions: r.transactions,
    }));

    return {
      totalRevenue,
      revenueThisMonth,
      successfulPayments: successfulPaymentsCount,
      failedPayments: failedPaymentsCount,
      activeSubscriptions: activeSubscriptionsCount,
      plans: planBreakdown,
      timeline: revenueTimeline,
    };
  }

  /**
   * Priority 4: User Growth & Acquisition Analytics
   */
  static async getUserAnalytics(timeRange = '30d') {
    const { startDate } = this.getDateRangeBounds(timeRange);

    const [totalUsers, totalDevelopers, newUsersInRange, newDevelopersInRange, dailySignups] =
      await Promise.all([
        User.countDocuments({ role: 'USER' }),
        User.countDocuments({ role: 'DEVELOPER' }),
        User.countDocuments({ role: 'USER', createdAt: { $gte: startDate } }),
        User.countDocuments({ role: 'DEVELOPER', createdAt: { $gte: startDate } }),
        User.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                role: '$role',
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.date': 1 } },
        ]),
      ]);

    const timelineMap = {};
    dailySignups.forEach((d) => {
      const date = d._id.date;
      if (!timelineMap[date]) {
        timelineMap[date] = { date, users: 0, developers: 0 };
      }
      if (d._id.role === 'DEVELOPER') {
        timelineMap[date].developers += d.count;
      } else {
        timelineMap[date].users += d.count;
      }
    });

    return {
      totalUsers,
      totalDevelopers,
      newUsersInRange,
      newDevelopersInRange,
      timeline: Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  /**
   * Priority 4: Application Growth & Category Insights
   */
  static async getAppAnalyticsSummary(timeRange = '30d') {
    const { startDate } = this.getDateRangeBounds(timeRange);

    const [
      totalApps,
      publishedApps,
      pendingApps,
      rejectedApps,
      categoryDistribution,
      topDownloadedApps,
    ] = await Promise.all([
      App.countDocuments(),
      App.countDocuments({ status: 'PUBLISHED' }),
      App.countDocuments({ status: 'PENDING_REVIEW' }),
      App.countDocuments({ status: 'REJECTED' }),
      App.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            downloads: { $sum: '$downloadCount' },
            views: { $sum: '$viewCount' },
          },
        },
        { $sort: { count: -1 } },
      ]),
      App.find({ status: 'PUBLISHED' })
        .sort({ downloadCount: -1 })
        .limit(10)
        .select('name slug icon downloadCount viewCount ratingAverage category developer')
        .populate('developer', 'name username')
        .lean(),
    ]);

    return {
      totalApps,
      publishedApps,
      pendingApps,
      rejectedApps,
      categoryDistribution: categoryDistribution.map((c) => ({
        category: c._id || 'General',
        count: c.count,
        downloads: c.downloads || 0,
        views: c.views || 0,
      })),
      topDownloadedApps: topDownloadedApps.map((a) => ({
        id: a._id,
        name: a.name,
        slug: a.slug,
        icon: a.icon,
        category: a.category,
        downloads: a.downloadCount || 0,
        views: a.viewCount || 0,
        rating: a.ratingAverage || 0,
        developerName: a.developer?.name || 'Developer',
      })),
    };
  }

  /**
   * Priority 7: Search Insights & Query Volume
   */
  static async getSearchAnalytics(timeRange = '30d') {
    const { startDate } = this.getDateRangeBounds(timeRange);

    // Aggregate from AnalyticsEvent (SEARCH_PERFORMED or SEARCH)
    const searchEvents = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: { $in: ['SEARCH', 'SEARCH_PERFORMED'] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $toLower: { $ifNull: ['$metadata.query', 'unknown'] } },
          frequency: { $sum: 1 },
          zeroResultCount: {
            $sum: { $cond: [{ $eq: ['$metadata.isZeroResult', true] }, 1, 0] },
          },
          lastSearchedAt: { $max: '$createdAt' },
        },
      },
      { $sort: { frequency: -1 } },
      { $limit: 20 },
    ]);

    const totalSearches = searchEvents.reduce((acc, s) => acc + s.frequency, 0);
    const zeroResultsSearches = searchEvents.filter((s) => s.zeroResultCount > 0);

    return {
      totalSearches,
      topSearches: searchEvents.map((s) => ({
        query: s._id,
        frequency: s.frequency,
        zeroResults: s.zeroResultCount,
        lastSearchedAt: s.lastSearchedAt,
      })),
      zeroResultQueries: zeroResultsSearches.map((s) => ({
        query: s._id,
        frequency: s.zeroResultCount,
      })),
    };
  }
}

export default AnalyticsService;
