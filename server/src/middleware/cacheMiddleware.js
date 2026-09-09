import { cacheService } from '../services/cache/cacheService.js';

/**
 * Route Caching Middleware (Phase 10)
 * Caches high-frequency read endpoints (popular, trending, categories, metadata)
 * with HTTP header observability (X-Cache: HIT / MISS).
 */
export const cacheRoute = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Only cache safe GET requests without user-specific authorization tokens
    if (req.method !== 'GET' || req.headers.authorization) {
      return next();
    }

    const cacheKey = `route:${req.originalUrl || req.url}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }
    } catch {
      // Proceed on cache error
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to populate cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Helper to invalidate cached routes by prefix (e.g. 'route:/api/apps').
 */
export const invalidateCache = async (prefix) => {
  return await cacheService.invalidatePattern(prefix);
};

export default cacheRoute;
