/**
 * API Response Helper Functions
 * Provides consistent response formatting across the API
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Response message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (
  res,
  data,
  message = "Success",
  statusCode = 200,
) => {
  res.status(statusCode).json({
    status: "success",
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Array} errors - Additional error details
 */
export const sendError = (
  res,
  message = "Error",
  statusCode = 400,
  errors = null,
) => {
  res.status(statusCode).json({
    status: "error",
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data
 * @param {Object} pagination - Pagination info (page, limit, total)
 * @param {string} message - Response message
 */
export const sendPaginated = (res, data, pagination, message = "Success") => {
  res.status(200).json({
    status: "success",
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
};
