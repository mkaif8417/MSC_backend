const express = require('express');
const Joi = require('joi');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Login validation schema
const loginSchema = {
  body: Joi.object({
    email: Joi.string().required().trim().messages({
      'string.empty': 'Email or username is required',
      'any.required': 'Email or username is required'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
  })
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user credentials & set HTTP-Only cookie
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.me);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clear authentication session cookie
 * @access  Private (or Public)
 */
router.post('/logout', authController.logout);

module.exports = router;
