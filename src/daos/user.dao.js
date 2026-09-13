const createBaseDao = require('./base.dao');
const User = require('../models/User');

const baseDao = createBaseDao(User);

/**
 * Find active user by email
 * @param {String} email User email address
 * @returns {Promise<Object|null>} User document
 */
const findByEmail = async (email) => {
  if (!email) return null;
  return baseDao.findOne({ email: email.toLowerCase().trim() });
};

/**
 * Find user by login identifier (email) explicitly including passwordHash
 * @param {String} identifier Email string
 * @returns {Promise<Object|null>} User document with passwordHash included
 */
const findByLoginWithPassword = async (identifier) => {
  if (!identifier) return null;
  const loginStr = identifier.toLowerCase().trim();

  return User.findOne({ email: loginStr })
    .select('+passwordHash')
    .exec();
};

/**
 * Create user document
 * @param {Object} userData User creation payload
 * @returns {Promise<Object>} Created user document
 */
const createUser = async (userData) => {
  if (userData.email) {
    userData.email = userData.email.toLowerCase().trim();
  }
  return baseDao.create(userData);
};

module.exports = {
  ...baseDao,
  findByEmail,
  findByLoginWithPassword,
  createUser
};
