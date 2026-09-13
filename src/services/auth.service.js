const userDao = require('../daos/user.dao');
const { signToken } = require('../utils/jwt');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Authenticate user credentials and generate session token
 * @param {String} email User login email
 * @param {String} password Plain password
 * @returns {Promise<Object>} { user, token }
 */
const login = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  // Retrieve user including passwordHash explicitly
  const user = await userDao.findByLoginWithPassword(email);

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = ERROR_CODES.INVALID_CREDENTIALS;
    throw error;
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = ERROR_CODES.INVALID_CREDENTIALS;
    throw error;
  }

  // Check account status
  if (!user.isActive) {
    const error = new Error('Account has been deactivated. Please contact your administrator');
    error.statusCode = 403;
    error.code = ERROR_CODES.ACCOUNT_DISABLED;
    throw error;
  }

  // Generate token with identity payload
  const token = signToken({
    id: user._id.toString(),
    role: user.role,
    scope: user.scope
  });

  // Convert doc to object to exclude passwordHash
  const userObject = user.toJSON();

  return {
    user: userObject,
    token
  };
};

/**
 * Fetch authenticated user profile
 * @param {String} userId User ID
 * @returns {Promise<Object>} User profile object
 */
const getCurrentUser = async (userId) => {
  const user = await userDao.findById(userId);

  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is disabled');
    error.statusCode = 403;
    error.code = ERROR_CODES.ACCOUNT_DISABLED;
    throw error;
  }

  return user.toJSON();
};

module.exports = {
  login,
  getCurrentUser
};
