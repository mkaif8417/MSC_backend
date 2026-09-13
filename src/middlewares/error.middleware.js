const ApiResponse = require('../utils/apiResponse');
const ERROR_CODES = require('../constants/errorCodes');
const env = require('../config/env');

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || [];

  // Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = ERROR_CODES.INVALID_ID;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    code = ERROR_CODES.DUPLICATE_RESOURCE;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Resource with this ${field} already exists`;
    details = [{ field, message: `${field} must be unique` }];
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map((item) => ({
      field: item.path,
      message: item.message
    }));
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ERROR_CODES.INVALID_TOKEN;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ERROR_CODES.TOKEN_EXPIRED;
    message = 'Authentication token expired';
  }

  // Log error in non-test environments if server error
  if (statusCode >= 500 && env.NODE_ENV !== 'test') {
    console.error('[ERROR]', err);
  }

  return ApiResponse.error(res, statusCode, code, message, details);
};

module.exports = errorHandler;
