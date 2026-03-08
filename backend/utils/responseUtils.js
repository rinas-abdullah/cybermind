// Response Utilities - Standardized API response formatting

/**
 * Success response
 * @param {object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {array} errors - Additional error details
 */
const errorResponse = (res, message = 'Error', statusCode = 500, errors = []) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {object} res - Express response object
 * @param {array} errors - Validation errors
 */
const validationErrorResponse = (res, errors = []) => {
  return errorResponse(res, 'Validation failed', 400, errors);
};

/**
 * Not found response
 * @param {object} res - Express response object
 * @param {string} resource - Resource type that was not found
 */
const notFoundResponse = (res, resource = 'Resource') => {
  return errorResponse(res, `${resource} not found`, 404);
};

/**
 * Unauthorized response
 * @param {object} res - Express response object
 * @param {string} message - Specific unauthorized message
 */
const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

/**
 * Paginated response
 * @param {object} res - Express response object
 * @param {array} items - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 */
const paginatedResponse = (res, items, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return successResponse(res, {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  paginatedResponse
};