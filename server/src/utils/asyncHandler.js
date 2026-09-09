/**
 * Wrapper function for asynchronous route handlers to eliminate try/catch boilerplate.
 * Any unhandled promise rejection is caught and passed to the next Express error middleware.
 *
 * @param {Function} fn - Async Express route handler (req, res, next)
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
