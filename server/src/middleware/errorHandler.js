import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';
import sentry from '../utils/sentry.js';

/**
 * Standard Error Code Mapping based on HTTP status.
 */
const getErrorCode = (statusCode, customCode) => {
  if (customCode && typeof customCode === 'string') return customCode;

  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'TOO_MANY_REQUESTS';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
};

/**
 * Handles Mongoose CastError (e.g. invalid ObjectId format).
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  const appErr = new AppError(message, 400);
  appErr.errorCode = 'INVALID_RESOURCE_IDENTIFIER';
  return appErr;
};

/**
 * Handles MongoDB duplicate key errors (code 11000).
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value '${value}' for ${field}. Please use another value.`;
  const appErr = new AppError(message, 409);
  appErr.errorCode = 'DUPLICATE_KEY_CONFLICT';
  return appErr;
};

/**
 * Handles Mongoose schema validation errors.
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {}).map((el) => ({
    field: el.path,
    message: el.message,
  }));
  const message = `Invalid input data: ${errors.map((e) => e.message).join('. ')}`;
  const appErr = new AppError(message, 400, errors);
  appErr.errorCode = 'VALIDATION_ERROR';
  return appErr;
};

/**
 * Sends detailed error feedback in development mode.
 */
const sendErrorDev = (err, req, res) => {
  const statusCode = err.statusCode || 500;
  const errorCode = getErrorCode(statusCode, err.errorCode);

  res.status(statusCode).json({
    success: false,
    code: errorCode,
    message: err.message,
    errors: err.errors || [],
    requestId: req.id || null,
    stack: err.stack,
    error: err,
  });
};

/**
 * Sends safe, sanitized error response in production/staging mode.
 */
const sendErrorProd = (err, req, res) => {
  const statusCode = err.statusCode || 500;
  const errorCode = getErrorCode(statusCode, err.errorCode);

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response = {
      success: false,
      code: errorCode,
      message: err.message,
      requestId: req.id || null,
    };
    if (err.errors && err.errors.length > 0) {
      response.errors = err.errors;
    }
    return res.status(statusCode).json(response);
  }

  // Programming or unknown error: do not leak infrastructure details
  logger.error(`[UNEXPECTED SYSTEM ERROR] ${err.message}`, {
    requestId: req.id,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  sentry.captureException(err, { requestId: req.id, url: req.originalUrl });

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please contact AppOrbit support if this persists.',
    requestId: req.id || null,
  });
};

/**
 * Global centralized Express error handling middleware.
 */
export const errorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.stack = err.stack;
  error.statusCode = err.statusCode;
  error.isOperational = err.isOperational;
  error.errors = err.errors;

  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

export default errorHandler;
