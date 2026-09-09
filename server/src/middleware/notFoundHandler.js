import { AppError } from '../utils/AppError.js';

/**
 * 404 Route Not Found middleware.
 * Catches any request that didn't match an active route and passes an AppError to errorHandler.
 */
export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
};

export default notFoundHandler;
