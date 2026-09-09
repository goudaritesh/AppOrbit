import mongoose from 'mongoose';
import App from '../models/App.js';
import Category from '../models/Category.js';
import AppVersion from '../models/AppVersion.js';
import { serializePublicApp } from '../utils/serializers.js';

/**
 * Escapes regex special characters to prevent ReDoS and injection
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sorting whitelist dictionary
 */
const SORT_OPTIONS = {
  popular: { downloadCount: -1, ratingAverage: -1 },
  recent: { publishedAt: -1, createdAt: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
  downloads: { downloadCount: -1 },
  alphabetical: { name: 1 },
};

/**
 * @desc    Get paginated public applications with search, filter, and sort
 * @route   GET /api/apps
 * @access  Public
 */
export const getApps = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const { search, category, platform, technology, verified, sort } = req.query;

    // Strict public visibility barrier: never expose draft, unlisted or private apps
    const query = {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    };

    // 1. Text / Substring Search
    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      const regex = new RegExp(escaped, 'i');
      query.$or = [
        { name: regex },
        { shortDescription: regex },
        { tags: regex },
        { technologies: regex },
      ];
    }

    // 2. Category Filter (slug or ObjectId)
    if (category && category.trim()) {
      const catSlug = category.trim().toLowerCase();
      const matchedCategory = await Category.findOne({
        slug: catSlug,
        status: 'ACTIVE',
      }).lean();

      if (matchedCategory) {
        query.category = matchedCategory._id;
      } else {
        // If category parameter was provided but not found, return empty results safely
        return res.status(200).json({
          success: true,
          message: 'No applications found for specified category',
          data: {
            apps: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        });
      }
    }

    // 3. Platform Filter
    if (platform && ['ANDROID', 'WEB', 'IOS'].includes(platform.toUpperCase())) {
      query.platform = platform.toUpperCase();
    }

    // 4. Technology Filter
    if (technology && technology.trim()) {
      const escapedTech = escapeRegex(technology.trim());
      query.technologies = { $in: [new RegExp(`^${escapedTech}$`, 'i')] };
    }

    // 5. Verification Filter
    if (verified === 'true' || verified === '1') {
      query.verificationStatus = 'VERIFIED';
    }

    // 6. Whitelisted Sorting
    const sortKey = (sort && sort.toLowerCase()) in SORT_OPTIONS ? sort.toLowerCase() : 'popular';
    const sortCriteria = SORT_OPTIONS[sortKey];

    const total = await App.countDocuments(query);
    const apps = await App.find(query)
      .populate('developer', 'name profileImage bio githubUrl portfolioUrl verificationStatus')
      .populate('category', 'name slug icon')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: {
        apps: apps.map(serializePublicApp),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get featured applications
 * @route   GET /api/apps/featured
 * @access  Public
 */
export const getFeaturedApps = async (req, res, next) => {
  try {
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 6));

    let featuredApps = await App.find({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      featured: true,
    })
      .populate('developer', 'name profileImage bio githubUrl portfolioUrl verificationStatus')
      .populate('category', 'name slug icon')
      .sort({ featuredOrder: 1, downloadCount: -1 })
      .limit(limit)
      .lean();

    // If fewer than requested featured apps exist, backfill with top-downloaded apps
    if (featuredApps.length < limit) {
      const existingIds = featuredApps.map((a) => a._id);
      const backfill = await App.find({
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        _id: { $nin: existingIds },
      })
        .populate('developer', 'name profileImage bio githubUrl portfolioUrl verificationStatus')
        .populate('category', 'name slug icon')
        .sort({ downloadCount: -1, ratingAverage: -1 })
        .limit(limit - featuredApps.length)
        .lean();

      featuredApps = [...featuredApps, ...backfill];
    }

    return res.status(200).json({
      success: true,
      message: 'Featured applications retrieved successfully',
      data: {
        apps: featuredApps.map(serializePublicApp),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get popular applications by download count and rating
 * @route   GET /api/apps/popular
 * @access  Public
 */
export const getPopularApps = async (req, res, next) => {
  try {
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 6));

    const apps = await App.find({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    })
      .populate('developer', 'name profileImage bio githubUrl portfolioUrl verificationStatus')
      .populate('category', 'name slug icon')
      .sort({ downloadCount: -1, ratingAverage: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Popular applications retrieved successfully',
      data: {
        apps: apps.map(serializePublicApp),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recently published applications
 * @route   GET /api/apps/recent
 * @access  Public
 */
export const getRecentApps = async (req, res, next) => {
  try {
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 6));

    const apps = await App.find({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    })
      .populate('developer', 'name profileImage bio githubUrl portfolioUrl verificationStatus')
      .populate('category', 'name slug icon')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Recently published applications retrieved successfully',
      data: {
        apps: apps.map(serializePublicApp),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single application details by URL slug
 * @route   GET /api/apps/:slug
 * @access  Public
 */
export const getAppBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const app = await App.findOne({
      slug: slug.toLowerCase(),
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    })
      .populate('developer', 'name profileImage bio githubUrl portfolioUrl verificationStatus')
      .populate('category', 'name slug icon description');

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Resolve currentVersion document if stored as ObjectId
    if (app.currentVersion && mongoose.isValidObjectId(app.currentVersion)) {
      const versionDoc = await AppVersion.findById(app.currentVersion).lean();
      if (versionDoc) {
        app.currentVersion = versionDoc;
      }
    }

    // Controlled view count increment (asynchronous fire-and-forget to avoid blocking response)
    App.updateOne({ _id: app._id }, { $inc: { viewCount: 1 } }).exec();

    return res.status(200).json({
      success: true,
      message: 'Application details retrieved successfully',
      data: {
        app: serializePublicApp(app),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get related applications in the same category
 * @route   GET /api/apps/:slug/related
 * @access  Public
 */
export const getRelatedApps = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const currentApp = await App.findOne({
      slug: slug.toLowerCase(),
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    }).select('category _id');

    if (!currentApp) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const related = await App.find({
      category: currentApp.category,
      _id: { $ne: currentApp._id },
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    })
      .populate('developer', 'name profileImage bio verificationStatus')
      .populate('category', 'name slug icon')
      .sort({ ratingAverage: -1, downloadCount: -1 })
      .limit(4)
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Related applications retrieved successfully',
      data: {
        apps: related.map(serializePublicApp),
      },
    });
  } catch (error) {
    next(error);
  }
};
