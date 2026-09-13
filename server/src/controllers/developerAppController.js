import mongoose from 'mongoose';
import App from '../models/App.js';
import Category from '../models/Category.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { SubscriptionLimitService } from '../services/admin/subscriptionLimitService.js';
import { NotificationService } from '../services/admin/notificationService.js';
import EventTrackingService from '../services/eventTrackingService.js';
import ActivityLogService from '../services/activityLogService.js';

/**
 * Escapes regex special characters to prevent ReDoS
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Whitelist sorting dictionary
 */
const SORT_OPTIONS = {
  updatedAt: { updatedAt: -1 },
  createdAt: { createdAt: -1 },
  name: { name: 1 },
  downloadCount: { downloadCount: -1 },
  viewCount: { viewCount: -1 },
};

/**
 * @desc    Create a new application draft
 * @route   POST /api/developer/apps
 * @access  Private (Developer only)
 */
export const createApp = async (req, res, next) => {
  try {
    // Phase 7: Account suspension and feature restriction checks
    if (req.user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        code: 'DEVELOPER_SUSPENDED',
        message: 'Your developer account has been suspended. Please contact platform support.',
      });
    }

    if (req.user.restrictedFeatures?.includes('PUBLISH_APP')) {
      return res.status(403).json({
        success: false,
        code: 'FEATURE_RESTRICTED',
        message: 'Application creation privileges are restricted on your account.',
      });
    }

    // Phase 7: Enforce subscription quotas
    const quota = await SubscriptionLimitService.checkAppCreationLimit(req.user._id);
    if (!quota.allowed) {
      return res.status(403).json({
        success: false,
        code: 'QUOTA_EXCEEDED',
        message: quota.reason,
        limit: quota.limit,
        used: quota.used,
        remaining: quota.remaining,
      });
    }
    const {
      name,
      shortDescription,
      description,
      category,
      platform,
      tags,
      features,
      technologies,
      icon,
      screenshots,
      demoVideo,
      githubUrl,
      demoUrl,
    } = req.body;

    // Verify category is valid and active
    const activeCategory = await Category.findOne({
      _id: category,
      status: 'ACTIVE',
    });

    if (!activeCategory) {
      return res.status(400).json({
        success: false,
        message: 'Selected category does not exist or is currently inactive',
      });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(App, name);

    const newApp = await App.create({
      name,
      slug,
      shortDescription,
      description: description || '',
      category: activeCategory._id,
      platform: platform || 'ANDROID',
      tags: Array.isArray(tags) ? tags : [],
      features: Array.isArray(features) ? features : [],
      technologies: Array.isArray(technologies) ? technologies : [],
      icon: icon || '',
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      demoVideo: demoVideo || {},
      githubUrl: githubUrl || '',
      demoUrl: demoUrl || '',
      developer: req.user._id, // Strictly set from authenticated session
      status: 'DRAFT', // Strictly enforce initial draft state
      visibility: 'PRIVATE', // Never public on initial creation
      verificationStatus: 'UNVERIFIED',
    });

    const populatedApp = await App.findById(newApp._id).populate('category', 'name slug icon');

    return res.status(201).json({
      success: true,
      message: 'Application draft created successfully',
      data: {
        app: populatedApp,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all applications owned by authenticated developer
 * @route   GET /api/developer/apps
 * @access  Private (Developer only)
 */
export const getDeveloperApps = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const { status, category, platform, search, sort } = req.query;

    // Strict ownership requirement: query MUST filter by authenticated developer ID
    const query = {
      developer: req.user._id,
    };

    if (status) {
      query.status = status;
    }

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category.toLowerCase() });
        if (cat) query.category = cat._id;
      }
    }

    if (platform) {
      query.platform = platform;
    }

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      const regex = new RegExp(escaped, 'i');
      query.$or = [{ name: regex }, { shortDescription: regex }, { tags: regex }];
    }

    const sortKey = sort in SORT_OPTIONS ? sort : 'updatedAt';
    const sortCriteria = SORT_OPTIONS[sortKey];

    const total = await App.countDocuments(query);
    const apps = await App.find(query)
      .populate('category', 'name slug icon')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      message: 'Developer applications retrieved successfully',
      data: {
        apps,
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
 * @desc    Get details of one developer-owned application
 * @route   GET /api/developer/apps/:appId
 * @access  Private (Developer only)
 */
export const getDeveloperApp = async (req, res, next) => {
  try {
    // req.app is verified by ownershipMiddleware
    const app = await App.findById(req.app._id).populate('category', 'name slug icon');

    return res.status(200).json({
      success: true,
      message: 'Application retrieved successfully',
      data: {
        app,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an application
 * @route   PATCH /api/developer/apps/:appId
 * @access  Private (Developer only)
 */
export const updateApp = async (req, res, next) => {
  try {
    const app = req.app; // From ownershipMiddleware

    const {
      name,
      shortDescription,
      description,
      category,
      platform,
      tags,
      features,
      technologies,
      icon,
      screenshots,
      demoVideo,
      githubUrl,
      demoUrl,
    } = req.body;

    // If category changed, verify it is valid and active
    if (category && category.toString() !== app.category.toString()) {
      const activeCategory = await Category.findOne({ _id: category, status: 'ACTIVE' });
      if (!activeCategory) {
        return res.status(400).json({
          success: false,
          message: 'Selected category is invalid or inactive',
        });
      }
      app.category = activeCategory._id;
    }

    // Slug management: regenerate unique slug only if name changed AND app is still in DRAFT
    if (name && name !== app.name) {
      app.name = name;
      if (app.status === 'DRAFT') {
        app.slug = await generateUniqueSlug(App, name, app._id);
      }
    }

    if (shortDescription !== undefined) app.shortDescription = shortDescription;
    if (description !== undefined) app.description = description;
    if (platform !== undefined) app.platform = platform;
    if (Array.isArray(tags)) app.tags = tags;
    if (Array.isArray(features)) app.features = features;
    if (Array.isArray(technologies)) app.technologies = technologies;
    if (icon !== undefined) app.icon = icon;
    if (Array.isArray(screenshots)) app.screenshots = screenshots;
    if (demoVideo !== undefined) app.demoVideo = demoVideo;
    if (githubUrl !== undefined) app.githubUrl = githubUrl;
    if (demoUrl !== undefined) app.demoUrl = demoUrl;

    await app.save();

    const updatedApp = await App.findById(app._id).populate('category', 'name slug icon');

    return res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: {
        app: updatedApp,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an application draft
 * @route   DELETE /api/developer/apps/:appId
 * @access  Private (Developer only)
 */
export const deleteApp = async (req, res, next) => {
  try {
    const app = req.app; // From ownershipMiddleware

    // Security: Only DRAFT applications can be permanently deleted
    if (app.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT applications can be permanently deleted. Please archive active applications instead.',
      });
    }

    await App.deleteOne({ _id: app._id });

    return res.status(200).json({
      success: true,
      message: 'Application draft deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit application for review
 * @route   POST /api/developer/apps/:appId/submit
 * @access  Private (Developer only)
 */
export const submitApp = async (req, res, next) => {
  try {
    const app = req.app; // From ownershipMiddleware

    // State validation
    if (app.status === 'ARCHIVED') {
      return res.status(400).json({
        success: false,
        message: 'Archived applications cannot be submitted. Please restore to draft first.',
      });
    }

    if (app.status === 'PENDING_REVIEW') {
      return res.status(400).json({
        success: false,
        message: 'Application is already pending review.',
      });
    }

    if (app.status === 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        message: 'Application is already published.',
      });
    }

    // Completeness validation
    const missing = [];
    if (!app.name || app.name.trim().length < 2) missing.push('Application Name');
    if (!app.shortDescription || app.shortDescription.trim().length < 5) missing.push('Short Description');
    if (!app.description || app.description.trim().length < 20) missing.push('Full Description (min 20 characters)');
    if (!app.category) missing.push('Category');
    if (!app.platform) missing.push('Platform');
    if (!app.technologies || app.technologies.length === 0) missing.push('At least one Technology');
    if (!app.features || app.features.length === 0) missing.push('At least one Feature');
    if (!app.icon || app.icon.trim().length === 0) missing.push('Application Icon');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Application is incomplete. Please provide: ${missing.join(', ')}`,
        missingFields: missing,
      });
    }

    // Phase 7: Suspension and feature restriction check
    if (req.user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        code: 'DEVELOPER_SUSPENDED',
        message: 'Your developer account has been suspended. Please contact platform support.',
      });
    }

    if (req.user.restrictedFeatures?.includes('SUBMIT_APP')) {
      return res.status(403).json({
        success: false,
        code: 'FEATURE_RESTRICTED',
        message: 'Application submission privileges are restricted on your account.',
      });
    }

    // Move to PENDING_REVIEW
    app.status = 'PENDING_REVIEW';
    // Maintain visibility as PRIVATE until future approval/APK phases
    app.visibility = 'PRIVATE';

    // Phase 7: Record submission in moderation history
    if (!app.moderation) app.moderation = { reviewHistory: [] };
    app.moderation.reviewHistory.push({
      action: 'SUBMITTED',
      adminName: req.user.name,
      adminEmail: req.user.email,
      reason: 'Application submitted by developer for platform review.',
      timestamp: new Date(),
    });

    await app.save();

    // Notify platform administrators
    await NotificationService.notifyAdmin({
      type: 'NEW_APP_SUBMITTED',
      title: 'New Application Submitted',
      message: `"${app.name}" was submitted for review by ${req.user.name}.`,
      priority: 'NORMAL',
      resourceType: 'APP',
      resourceId: app._id.toString(),
    });

    // Sprint 10 Event Tracking & Activity Logging
    EventTrackingService.track(EventTrackingService.EVENT_TYPES.APP_PUBLISHED, {
      appId: app._id,
      userId: req.user._id,
      developerId: req.user._id,
      metadata: { appName: app.name, category: app.category },
    }).catch(() => {});

    ActivityLogService.logActivity({
      actorId: req.user._id,
      actorRole: 'DEVELOPER',
      actorEmail: req.user.email,
      action: ActivityLogService.ACTIONS.DEVELOPER_PUBLISHED_APP,
      resourceType: 'APP',
      resourceId: app._id,
      reason: 'Application submitted for platform review',
      metadata: { appName: app.name },
      ipAddress: req.ip,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Application submitted for review successfully',
      data: {
        app,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Archive application
 * @route   POST /api/developer/apps/:appId/archive
 * @access  Private (Developer only)
 */
export const archiveApp = async (req, res, next) => {
  try {
    const app = req.app;

    if (app.status === 'ARCHIVED') {
      return res.status(400).json({
        success: false,
        message: 'Application is already archived',
      });
    }

    app.status = 'ARCHIVED';
    app.visibility = 'PRIVATE'; // Hide from any public discovery

    await app.save();

    return res.status(200).json({
      success: true,
      message: 'Application archived successfully',
      data: {
        app,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Restore an archived application back to DRAFT
 * @route   POST /api/developer/apps/:appId/restore
 * @access  Private (Developer only)
 */
export const restoreApp = async (req, res, next) => {
  try {
    const app = req.app;

    if (app.status !== 'ARCHIVED') {
      return res.status(400).json({
        success: false,
        message: 'Only archived applications can be restored',
      });
    }

    app.status = 'DRAFT';
    app.visibility = 'PRIVATE';

    await app.save();

    return res.status(200).json({
      success: true,
      message: 'Application restored to DRAFT status',
      data: {
        app,
      },
    });
  } catch (error) {
    next(error);
  }
};
