/**
 * Higher-order function wrapping async route handlers to catch exceptions
 * and forward them to the global error handling middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
