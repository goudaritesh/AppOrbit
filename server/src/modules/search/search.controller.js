import SearchService from './search.service.js';

export const searchApps = async (req, res, next) => {
  try {
    const { q, category, technology, platform, minRating, sort, page, limit } = req.query;
    const userId = req.user?._id || null;

    const result = await SearchService.searchApps({
      q,
      category,
      technology,
      platform,
      minRating,
      sort,
      page,
      limit,
      userId,
    });

    res.json({
      success: true,
      results: result.results || result.apps || [],
      data: result,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    const result = await SearchService.getSuggestions(q);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPopularSearches = async (req, res, next) => {
  try {
    const result = await SearchService.getPopularSearches();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSearchHistory = async (req, res, next) => {
  try {
    const result = await SearchService.getUserSearchHistory(req.user._id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const clearUserSearchHistory = async (req, res, next) => {
  try {
    const result = await SearchService.clearUserSearchHistory(req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPopularApps = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const apps = await SearchService.getPopularApps({ limit });
    res.json({
      success: true,
      data: apps,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingApps = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const apps = await SearchService.getTrendingApps({ limit });
    res.json({
      success: true,
      data: apps,
    });
  } catch (error) {
    next(error);
  }
};

export const getNewReleases = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const apps = await SearchService.getNewReleases({ limit });
    res.json({
      success: true,
      data: apps,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentlyUpdated = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const apps = await SearchService.getRecentlyUpdated({ limit });
    res.json({
      success: true,
      data: apps,
    });
  } catch (error) {
    next(error);
  }
};

export const getRelatedApps = async (req, res, next) => {
  try {
    const appId = req.params.appId || req.params.slug;
    const { limit } = req.query;
    const apps = await SearchService.getRelatedApps(appId, { limit });
    res.json({
      success: true,
      data: apps,
    });
  } catch (error) {
    next(error);
  }
};
