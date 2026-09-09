import mongoose from 'mongoose';
import App from '../models/App.js';

/**
 * @desc    Get aggregated metrics and status distribution for developer's applications
 * @route   GET /api/developer/analytics
 * @access  Private (Developer only)
 */
export const getDeveloperAnalytics = async (req, res, next) => {
  try {
    const developerId = req.user._id;

    // Aggregation pipeline to compute counts, downloads, views, and ratings in a single pass
    const stats = await App.aggregate([
      { $match: { developer: developerId } },
      {
        $group: {
          _id: null,
          totalApps: { $sum: 1 },
          publishedApps: {
            $sum: { $cond: [{ $eq: ['$status', 'PUBLISHED'] }, 1, 0] },
          },
          draftApps: {
            $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] },
          },
          pendingApps: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING_REVIEW'] }, 1, 0] },
          },
          archivedApps: {
            $sum: { $cond: [{ $eq: ['$status', 'ARCHIVED'] }, 1, 0] },
          },
          rejectedApps: {
            $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] },
          },
          totalDownloads: { $sum: '$downloadCount' },
          totalViews: { $sum: '$viewCount' },
          avgRating: { $avg: '$ratingAverage' },
        },
      },
    ]);

    // Status counts map
    const statusCountsAgg = await App.aggregate([
      { $match: { developer: developerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts = {
      DRAFT: 0,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      PUBLISHED: 0,
      REJECTED: 0,
      SUSPENDED: 0,
      ARCHIVED: 0,
    };

    statusCountsAgg.forEach((item) => {
      if (item._id in statusCounts) {
        statusCounts[item._id] = item.count;
      }
    });

    // Recent 5 apps
    const recentApps = await App.find({ developer: developerId })
      .populate('category', 'name slug icon')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const overview = stats[0]
      ? {
          totalApps: stats[0].totalApps || 0,
          publishedApps: stats[0].publishedApps || 0,
          draftApps: stats[0].draftApps || 0,
          pendingApps: stats[0].pendingApps || 0,
          archivedApps: stats[0].archivedApps || 0,
          rejectedApps: stats[0].rejectedApps || 0,
          totalDownloads: stats[0].totalDownloads || 0,
          totalViews: stats[0].totalViews || 0,
          averageRating: Math.round((stats[0].avgRating || 0) * 10) / 10,
        }
      : {
          totalApps: 0,
          publishedApps: 0,
          draftApps: 0,
          pendingApps: 0,
          archivedApps: 0,
          rejectedApps: 0,
          totalDownloads: 0,
          totalViews: 0,
          averageRating: 0,
        };

    return res.status(200).json({
      success: true,
      message: 'Developer analytics retrieved successfully',
      data: {
        overview,
        statusCounts,
        recentApps,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed metrics for one developer-owned application
 * @route   GET /api/developer/apps/:appId/analytics
 * @access  Private (Developer only)
 */
export const getAppAnalytics = async (req, res, next) => {
  try {
    const app = req.app; // From ownershipMiddleware

    return res.status(200).json({
      success: true,
      message: 'Application analytics retrieved successfully',
      data: {
        appId: app._id,
        name: app.name,
        slug: app.slug,
        status: app.status,
        downloadCount: app.downloadCount || 0,
        viewCount: app.viewCount || 0,
        ratingAverage: app.ratingAverage || 0,
        ratingCount: app.ratingCount || 0,
        currentVersion: app.currentVersion || {},
        lastUpdated: app.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
