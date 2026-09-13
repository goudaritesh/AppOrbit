import mongoose from 'mongoose';
import MongoSearchProvider from './searchProvider.js';
import App from '../../models/App.js';
import Category from '../../models/Category.js';
import User from '../../models/User.js';
import SearchHistory from '../../models/SearchHistory.js';
import DownloadEvent from '../../models/DownloadEvent.js';
import AnalyticsEvent from '../../models/AnalyticsEvent.js';
import EventTrackingService from '../../services/eventTrackingService.js';

export class SearchService {
  /**
   * Executes advanced multi-field search and logs query history for authenticated users.
   */
  static async searchApps({
    q = '',
    category = null,
    technology = null,
    platform = null,
    minRating = null,
    sort = 'RELEVANCE',
    page = 1,
    limit = 12,
    userId = null,
  }) {
    const cleanQuery = typeof q === 'string' ? q.trim() : '';

    // Log query in search history asynchronously if user is logged in
    if (userId && cleanQuery.length >= 2) {
      SearchHistory.create({
        user: userId,
        query: cleanQuery.toLowerCase(),
      }).catch((err) => console.error('Error logging search history:', err.message));
    }

    const searchResult = await MongoSearchProvider.search({
      q: cleanQuery,
      category,
      technology,
      platform,
      minRating,
      sort,
      page,
      limit,
    });

    // Log analytics event with result count and zero-result indicator
    if (cleanQuery.length >= 2) {
      const resultsCount = searchResult.pagination?.total || (searchResult.apps?.length || 0);
      EventTrackingService.trackSearch(cleanQuery, {
        userId,
        resultsCount,
        category,
      }).catch(() => {});
    }

    return searchResult;
  }

  /**
   * Returns instant search autocomplete suggestions matching apps, categories, and developers.
   */
  static async getSuggestions(q = '') {
    const cleanQuery = typeof q === 'string' ? q.trim() : '';
    if (!cleanQuery || cleanQuery.length < 1) {
      return { apps: [], categories: [], developers: [], popular: [] };
    }

    const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedQuery}`, 'i');
    const subRegex = new RegExp(escapedQuery, 'i');

    const [matchingApps, matchingCategories, matchingDevs, popularQueries] = await Promise.all([
      App.find({
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        $or: [{ name: regex }, { name: subRegex }],
      })
        .select('name slug icon category ratingAverage downloadCount')
        .limit(5)
        .populate('category', 'name')
        .lean(),

      Category.find({
        name: subRegex,
      })
        .select('name slug icon')
        .limit(3)
        .lean(),

      User.find({
        role: { $in: ['DEVELOPER', 'ADMIN'] },
        name: subRegex,
      })
        .select('name username avatar')
        .limit(3)
        .lean(),

      SearchHistory.aggregate([
        { $match: { query: regex } },
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 4 },
      ]),
    ]);

    return {
      apps: matchingApps.map((a) => ({
        id: a._id,
        name: a.name,
        slug: a.slug,
        icon: a.icon,
        category: a.category?.name,
        ratingAverage: a.ratingAverage,
      })),
      categories: matchingCategories.map((c) => ({
        name: c.name,
        slug: c.slug,
      })),
      developers: matchingDevs.map((d) => ({
        id: d._id,
        name: d.name,
        username: d.username,
        avatar: d.avatar,
      })),
      popular: popularQueries.map((p) => p._id),
    };
  }

  /**
   * Returns aggregate popular search queries across platform.
   */
  static async getPopularSearches() {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const aggregates = await SearchHistory.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    if (aggregates.length > 0) {
      return aggregates.map((a) => a._id);
    }

    // Default discovery seeds if no search history yet
    return ['Health', 'Security', 'Productivity', 'Finance', 'Tools', 'AI', 'Social'];
  }

  /**
   * Retrieves an authenticated user's search history.
   */
  static async getUserSearchHistory(userId) {
    const history = await SearchHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('query createdAt')
      .lean();

    return history;
  }

  /**
   * Clears an authenticated user's search history.
   */
  static async clearUserSearchHistory(userId) {
    await SearchHistory.deleteMany({ user: userId });
    return { success: true, message: 'Search history cleared' };
  }

  /**
   * Discovery: Popular Applications (High downloads + high rating)
   */
  static async getPopularApps({ limit = 8 } = {}) {
    const limitNum = Math.min(30, Math.max(1, parseInt(limit, 10) || 8));

    return await App.find({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    })
      .sort({ downloadCount: -1, ratingAverage: -1 })
      .limit(limitNum)
      .populate('developer', 'name username isVerified avatar')
      .populate('category', 'name slug icon')
      .lean();
  }

  /**
   * Discovery: Trending Applications (Recency weighted)
   */
  static async getTrendingApps({ limit = 8 } = {}) {
    const limitNum = Math.min(30, Math.max(1, parseInt(limit, 10) || 8));
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find apps with most downloads in last 7 days
    const recentEvents = await DownloadEvent.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, eventType: { $in: ['DOWNLOAD_STARTED', 'DOWNLOAD_COMPLETED'] } } },
      { $group: { _id: '$application', recentDownloads: { $sum: 1 } } },
      { $sort: { recentDownloads: -1 } },
      { $limit: limitNum },
    ]);

    let trendingAppIds = recentEvents.map((e) => e._id);

    // Fallback: If not enough recent download events, fill with top-rated apps published recently
    if (trendingAppIds.length < limitNum) {
      const fallbackApps = await App.find({
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        _id: { $nin: trendingAppIds },
      })
        .sort({ ratingAverage: -1, downloadCount: -1, updatedAt: -1 })
        .limit(limitNum - trendingAppIds.length)
        .select('_id')
        .lean();

      trendingAppIds = [...trendingAppIds, ...fallbackApps.map((a) => a._id)];
    }

    return await App.find({
      _id: { $in: trendingAppIds },
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    })
      .populate('developer', 'name username isVerified avatar')
      .populate('category', 'name slug icon')
      .lean();
  }

  /**
   * Discovery: New Releases
   */
  static async getNewReleases({ limit = 8 } = {}) {
    const limitNum = Math.min(30, Math.max(1, parseInt(limit, 10) || 8));

    return await App.find({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limitNum)
      .populate('developer', 'name username isVerified avatar')
      .populate('category', 'name slug icon')
      .lean();
  }

  /**
   * Discovery: Recently Updated Apps
   */
  static async getRecentlyUpdated({ limit = 8 } = {}) {
    const limitNum = Math.min(30, Math.max(1, parseInt(limit, 10) || 8));

    return await App.find({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    })
      .sort({ updatedAt: -1 })
      .limit(limitNum)
      .populate('developer', 'name username isVerified avatar')
      .populate('category', 'name slug icon')
      .lean();
  }

  /**
   * Discovery: Related Applications
   */
  static async getRelatedApps(appId, { limit = 4 } = {}) {
    const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10) || 4));

    const isObjectId = mongoose.isValidObjectId(appId);
    const sourceApp = isObjectId
      ? await App.findById(appId).select('category tags technologies platform')
      : await App.findOne({ slug: appId }).select('category tags technologies platform');
    if (!sourceApp) return [];

    const query = {
      _id: { $ne: sourceApp._id },
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      $or: [
        { category: sourceApp.category },
        { tags: { $in: sourceApp.tags || [] } },
        { technologies: { $in: sourceApp.technologies || [] } },
      ],
    };

    return await App.find(query)
      .sort({ ratingAverage: -1, downloadCount: -1 })
      .limit(limitNum)
      .populate('developer', 'name username isVerified avatar')
      .populate('category', 'name slug icon')
      .lean();
  }
}

export default SearchService;
