import App from '../../models/App.js';
import Category from '../../models/Category.js';
import User from '../../models/User.js';

/**
 * Search Provider Interface & MongoDB Implementation (Phase 9)
 * Designed with provider abstraction to support Elasticsearch or Meilisearch in future phases.
 */
export class MongoSearchProvider {
  /**
   * Performs multi-field search with weighted relevance and flexible filtering.
   */
  static async search({
    q = '',
    category = null,
    technology = null,
    platform = null,
    minRating = null,
    sort = 'RELEVANCE',
    page = 1,
    limit = 12,
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Base filter: Only active, published apps
    const baseFilter = {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    };

    // Category filter
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        baseFilter.category = category;
      } else {
        const catDoc = await Category.findOne({
          $or: [{ slug: category.toLowerCase() }, { name: new RegExp(`^${category}$`, 'i') }],
        });
        if (catDoc) {
          baseFilter.category = catDoc._id;
        }
      }
    }

    // Technology filter
    if (technology) {
      baseFilter.technologies = { $regex: new RegExp(`^${technology}$`, 'i') };
    }

    // Platform filter
    if (platform) {
      baseFilter.platform = platform.toUpperCase();
    }

    // Min rating filter
    if (minRating && Number(minRating) > 0) {
      baseFilter.ratingAverage = { $gte: Number(minRating) };
    }

    // Text Query Processing
    const query = { ...baseFilter };
    const cleanQuery = q.trim();

    if (cleanQuery) {
      const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'i');

      // Check if query matches a developer name first
      const matchedDevs = await User.find({
        role: { $in: ['DEVELOPER', 'ADMIN'] },
        name: { $regex: regex },
      }).select('_id');

      const devIds = matchedDevs.map((d) => d._id);

      query.$or = [
        { name: { $regex: regex } },
        { shortDescription: { $regex: regex } },
        { tags: { $in: [regex] } },
        { technologies: { $in: [regex] } },
        ...(devIds.length > 0 ? [{ developer: { $in: devIds } }] : []),
      ];
    }

    // Sorting definition
    let sortOptions = {};
    switch (sort?.toUpperCase()) {
      case 'POPULARITY':
      case 'MOST_DOWNLOADED':
        sortOptions = { downloadCount: -1, ratingAverage: -1 };
        break;
      case 'RATING':
        sortOptions = { ratingAverage: -1, ratingCount: -1 };
        break;
      case 'NEWEST':
        sortOptions = { publishedAt: -1, createdAt: -1 };
        break;
      case 'TRENDING':
        sortOptions = { ratingAverage: -1, downloadCount: -1, updatedAt: -1 };
        break;
      case 'RELEVANCE':
      default:
        if (cleanQuery) {
          // Default to high rating and download count among matched records
          sortOptions = { downloadCount: -1, ratingAverage: -1 };
        } else {
          sortOptions = { publishedAt: -1, createdAt: -1 };
        }
        break;
    }

    const [apps, total] = await Promise.all([
      App.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('developer', 'name username isVerified avatar')
        .populate('category', 'name slug icon')
        .populate('currentVersion', 'versionName versionCode securityStatus')
        .lean(),
      App.countDocuments(query),
    ]);

    return {
      results: apps,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      query: cleanQuery,
    };
  }
}

export default MongoSearchProvider;
