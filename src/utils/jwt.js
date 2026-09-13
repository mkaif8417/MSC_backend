const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign JWT token for user session
 * @param {Object} payload Payload data (id, role, scope)
 * @returns {String} Signed JWT token
 */
function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

/**
 * Verify JWT token string
 * @param {String} token JWT Token
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken
};
