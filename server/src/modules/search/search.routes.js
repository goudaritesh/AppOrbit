import { Router } from 'express';
import {
  searchApps,
  getSuggestions,
  getPopularSearches,
  getUserSearchHistory,
  clearUserSearchHistory,
  getPopularApps,
  getTrendingApps,
  getNewReleases,
  getRecentlyUpdated,
  getRelatedApps,
} from './search.controller.js';
import { protect, optionalAuth } from '../../middleware/authMiddleware.js';

const router = Router();

/* ==========================================
   PRIMARY SEARCH ROUTING (/api/search)
   ========================================== */

// Main multi-field search endpoint
router.get('/', optionalAuth, searchApps);

// Autocomplete suggestions
router.get('/suggestions', getSuggestions);

// Popular search trends
router.get('/popular', getPopularSearches);

// User search history (authenticated)
router.get('/history', protect, getUserSearchHistory);
router.delete('/history', protect, clearUserSearchHistory);

export default router;

/* ==========================================
   DISCOVERY FEED ROUTES HELPER (/api/apps/...)
   ========================================== */
export const discoveryRouter = Router();

discoveryRouter.get('/popular', getPopularApps);
discoveryRouter.get('/trending', getTrendingApps);
discoveryRouter.get('/new', getNewReleases);
discoveryRouter.get('/recently-updated', getRecentlyUpdated);
discoveryRouter.get('/:appId/related', getRelatedApps);
