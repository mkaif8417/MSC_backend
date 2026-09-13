const ERROR_CODES = require('../constants/errorCodes');

class ApiError extends Error {
  constructor(statusCode, message, code = ERROR_CODES.INTERNAL_SERVER_ERROR, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message = 'Resource not found', details = []) {
    return new ApiError(404, message, ERROR_CODES.NOT_FOUND, details);
  }

  static badRequest(message = 'Bad request', details = []) {
    return new ApiError(400, message, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthorized(message = 'Unauthorized', details = []) {
    return new ApiError(401, message, ERROR_CODES.UNAUTHORIZED, details);
  }

  static forbidden(message = 'Forbidden', details = []) {
    return new ApiError(403, message, ERROR_CODES.FORBIDDEN, details);
  }

  static conflict(message = 'Resource already exists', details = []) {
    return new ApiError(409, message, ERROR_CODES.DUPLICATE_RESOURCE, details);
  }
}

module.exports = ApiError;