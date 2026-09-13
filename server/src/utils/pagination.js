/**
 * Centralized Pagination Utility (Sprint 11)
 * Enforces uniform pagination parameter parsing, defensive limits,
 * and standard envelope formatting across all AppOrbit API endpoints.
 */

/**
 * Extracts and sanitizes pagination parameters from request query.
 * @param {object} query - Express req.query
 * @param {number} [defaultLimit=10] - Default items per page
 * @param {number} [maxLimit=100] - Hard cap on items per page to protect server memory
 * @returns {{ page: number, limit: number, skip: number }}
 */
export const getPaginationParams = (query = {}, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.max(1, Math.min(maxLimit, rawLimit));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/**
 * Formats data list and metadata into standardized pagination envelope.
 * @param {object} options
 * @param {Array} options.data - Results array
 * @param {number} options.total - Total matching records count
 * @param {number} options.page - Current page number
 * @param {number} options.limit - Items per page
 * @returns {{ data: Array, pagination: { page: number, limit: number, total: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean } }}
 */
export const formatPaginationResponse = ({ data = [], total = 0, page = 1, limit = 10 }) => {
  const totalPages = Math.ceil(total / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
};

export default {
  getPaginationParams,
  formatPaginationResponse,
};
