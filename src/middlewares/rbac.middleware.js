const ApiResponse = require('../utils/apiResponse');
const ERROR_CODES = require('../constants/errorCodes');
const { ROLES } = require('../constants/roles');
const { ROLE_PERMISSIONS } = require('../constants/permissions');

/**
 * Role-Based Access Control Middleware
 * Verifies that the authenticated user possesses an allowed system role.
 * @param {...String} allowedRoles List of roles permitted to access endpoint
 */
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(
        res,
        401,
        ERROR_CODES.UNAUTHORIZED,
        'Authentication required'
      );
    }

    // Super Admin has global bypass capability
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to perform this action'
      );
    }

    next();
  };
};

/**
 * Permission-Based Access Control Middleware
 * Verifies that the authenticated user's role grants required permissions.
 * @param {...String} requiredPermissions List of permissions required
 */
const requirePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(
        res,
        401,
        ERROR_CODES.UNAUTHORIZED,
        'Authentication required'
      );
    }

    // Super Admin has all permissions
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return ApiResponse.error(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'You lack the permissions required to access this resource'
      );
    }

    next();
  };
};

module.exports = {
  requireRoles,
  requirePermissions
};
