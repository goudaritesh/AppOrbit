import Category from '../models/Category.js';
import App from '../models/App.js';
import { serializePublicApp, serializePublicCategory } from '../utils/serializers.js';

/**
 * @desc    Get all active marketplace categories
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ status: 'ACTIVE' })
      .sort({ order: 1, name: 1 })
      .lean();

    // Dynamically calculate actual published app count per category
    const appCounts = await App.aggregate([
      { $match: { status: 'PUBLISHED', visibility: 'PUBLIC' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = appCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const enrichedCategories = categories.map((cat) => ({
      ...cat,
      appCount: countMap[cat._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      message: 'Active categories fetched successfully',
      data: {
        categories: enrichedCategories.map(serializePublicCategory),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public applications belonging to a specific category
 * @route   GET /api/categories/:slug/apps
 * @access  Public
 */
export const getCategoryApps = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const category = await Category.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' }).lean();
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or currently inactive',
      });
    }

    const filter = {
      category: category._id,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    };

    const total = await App.countDocuments(filter);
    const apps = await App.find(filter)
      .populate('developer', 'name profileImage bio githubUrl portfolioUrl')
      .populate('category', 'name slug icon')
      .sort({ downloadCount: -1, ratingAverage: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      message: 'Category applications retrieved successfully',
      data: {
        category: serializePublicCategory(category),
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
