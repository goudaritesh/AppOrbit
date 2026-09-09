/**
 * Standardized API Response Utilities
 * Enforces uniform envelope responses across all AppOrbit API endpoints.
 */

/**
 * Sends a successful JSON response envelope.
 * @param {object} res - Express response object
 * @param {string} message - Human-readable summary
 * @param {any} [data=null] - Payload object or array
 * @param {number} [statusCode=200] - HTTP status code
 */
export const sendSuccess = (res, message = 'Request successful', data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Sends a standardized error JSON response envelope.
 * @param {object} res - Express response object
 * @param {string} message - Human-readable error description
 * @param {number} [statusCode=500] - HTTP status code
 * @param {Array} [errors=[]] - Array of error messages or validation issues
 */
export const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = []) => {
  const response = {
    success: false,
    message,
  };

  if (Array.isArray(errors) && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export default {
  sendSuccess,
  sendError,
};
