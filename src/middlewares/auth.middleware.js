const { verifyToken } = require('../utils/jwt');
const userDao = require('../daos/user.dao');
const env = require('../config/env');
const ApiResponse = require('../utils/apiResponse');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Authentication Middleware
 * Identifies and validates authenticated user from HTTP-Only cookie or Authorization header.
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Read token from HTTP-Only Cookie
    if (req.cookies && req.cookies[env.AUTH_COOKIE_NAME]) {
      token = req.cookies[env.AUTH_COOKIE_NAME];
    }
    // 2. Fallback: Read from Authorization header if provided
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.error(
        res,
        401,
        ERROR_CODES.UNAUTHORIZED,
        'Authentication required. Please log in'
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return ApiResponse.error(
        res,
        401,
        ERROR_CODES.INVALID_TOKEN,
        'Invalid or corrupted session token'
      );
    }

    // Load active user from database
    const user = await userDao.findById(decoded.id);

    if (!user) {
      return ApiResponse.error(
        res,
        401,
        ERROR_CODES.UNAUTHORIZED,
        'User account no longer exists'
      );
    }

    if (!user.isActive) {
      return ApiResponse.error(
        res,
        403,
        ERROR_CODES.ACCOUNT_DISABLED,
        'Account has been deactivated'
      );
    }

    // Attach authenticated user context to request
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      scope: user.scope
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(
        res,
        401,
        ERROR_CODES.TOKEN_EXPIRED,
        'Session expired. Please log in again'
      );
    }
    return ApiResponse.error(
      res,
      401,
      ERROR_CODES.INVALID_TOKEN,
      'Authentication failed'
    );
  }
};

module.exports = {
  authenticate
};
