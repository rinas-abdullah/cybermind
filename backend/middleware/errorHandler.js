// Error Handling Middleware - Centralized error management
const logger = require("../utils/logger");

function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

function getSafeStatusCode(status) {
  return Number.isInteger(status) && status >= 400 && status <= 599
    ? status
    : 500;
}

function buildErrorLog(err, req) {
  return {
    message: err?.message || "Unknown error",
    status: getSafeStatusCode(err?.status),
    isOperational: Boolean(err?.isOperational),
    code: err?.code || null,
    method: req?.method || "UNKNOWN",
    url: req?.originalUrl || req?.url || "UNKNOWN",
    ip: req?.ip || "unknown",
    userAgent: req?.get?.("user-agent") || "unknown",
    requestId: req?.requestId || null,
    timestamp: new Date().toISOString(),
    ...(!isProductionEnv() && { stack: err?.stack || null }),
  };
}

function sendErrorResponse(res, req, statusCode, message, err = null) {
  const isDevelopment = !isProductionEnv();

  return res.status(statusCode).json({
    success: false,
    message,
    requestId: req?.requestId || null,
    timestamp: new Date().toISOString(),
    ...(isDevelopment && err?.stack ? { stack: err.stack } : {}),
  });
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isDevelopment = !isProductionEnv();
  const statusCode = getSafeStatusCode(err?.status);
  const isOperational = Boolean(err?.isOperational);

  logger.error("Error occurred", buildErrorLog(err, req));

  let message = "Internal server error";

  if (isDevelopment) {
    message = err?.message || message;
  } else if (isOperational && err?.message) {
    message = err.message;
  }

  return sendErrorResponse(res, req, statusCode, message, err);
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  const isDevelopment = !isProductionEnv();

  return res.status(404).json({
    success: false,
    message: isDevelopment
      ? `Route ${req.method} ${req.originalUrl || req.path} not found`
      : "Resource not found",
    requestId: req?.requestId || null,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async error wrapper - catches async errors
 */
function asyncHandler(fn) {
  return function wrappedAsyncHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error with status code
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, code = null) {
    super(message);

    this.name = "AppError";
    this.status = getSafeStatusCode(statusCode);
    this.isOperational = isOperational;
    this.code = code;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = {
  buildErrorLog,
  sendErrorResponse,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
};