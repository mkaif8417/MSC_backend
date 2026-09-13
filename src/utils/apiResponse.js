/**
 * Standardized API response serializer (Function-based)
 */

/**
 * Success Response Formatter
 */
const success = (res, statusCode = 200, message = 'Operation successful', data = null, meta = undefined) => {
  const payload = {
    success: true,
    message,
    data: data !== null ? data : {}
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Error Response Formatter
 */
const error = (res, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', message = 'An unexpected error occurred', details = []) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: Array.isArray(details) ? details : [details]
    }
  });
};

module.exports = {
  success,
  error
};
