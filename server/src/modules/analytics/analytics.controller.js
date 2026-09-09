import AnalyticsService from './analytics.service.js';

export const trackEvent = async (req, res, next) => {
  try {
    const { eventType, appId, developerId, visitorId, source, metadata } = req.body;
    const user = req.user || null;

    await AnalyticsService.trackEvent({
      eventType,
      appId,
      developerId,
      user,
      visitorId,
      source,
      metadata,
    });

    res.status(202).json({
      success: true,
      message: 'Event recorded',
    });
  } catch (error) {
    next(error);
  }
};

export const getDeveloperOverview = async (req, res, next) => {
  try {
    const { range } = req.query;
    const result = await AnalyticsService.getDeveloperOverview(req.user._id, range);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAppAnalytics = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { range } = req.query;
    const developerId = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' ? null : req.user._id;

    const result = await AnalyticsService.getAppAnalytics(appId, developerId, range);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminPlatformAnalytics = async (req, res, next) => {
  try {
    const { range } = req.query;
    const result = await AnalyticsService.getAdminPlatformAnalytics(range);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
