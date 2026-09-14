const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

/**
 * Cookie options for HTTP-Only Auth Cookie
 */
const getCookieOptions = () => {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction, // must be true for sameSite: 'none' to work
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  };
};

/**
 * User Login Controller
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await authService.login(email, password);

  // Set HTTP-Only authentication cookie
  res.cookie(env.AUTH_COOKIE_NAME, token, getCookieOptions());

  return ApiResponse.success(res, 200, 'Login successful', {
    user
  });
});

/**
 * Current Authenticated User Profile Controller
 * GET /api/v1/auth/me
 */
const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  return ApiResponse.success(res, 200, 'User profile fetched successfully', {
    user
  });
});

/**
 * User Logout Controller
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { maxAge, ...clearCookieOptions } = getCookieOptions();
  // Clear HTTP-Only authentication cookie
  res.clearCookie(env.AUTH_COOKIE_NAME, clearCookieOptions);

  return ApiResponse.success(res, 200, 'Logout successful', {});
});

module.exports = {
  login,
  me,
  logout
};
