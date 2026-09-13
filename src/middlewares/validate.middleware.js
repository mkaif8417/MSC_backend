const Joi = require('joi');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Generic Joi schema validation middleware
 * @param {Object} schema Joi schema object containing optional body, query, or params
 */
const validate = (schema) => (req, res, next) => {
  const validationTargets = ['body', 'query', 'params'];

  for (const target of validationTargets) {
    if (schema[target]) {
      const { error, value } = schema[target].validate(req[target], {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const details = error.details.map((item) => ({
          field: item.path.join('.'),
          message: item.message.replace(/['"]/g, '')
        }));

        const err = new Error('Validation failed');
        err.statusCode = 400;
        err.code = ERROR_CODES.VALIDATION_ERROR;
        err.details = details;
        return next(err);
      }

      // Assign sanitized & stripped values back to request
      req[target] = value;
    }
  }

  next();
};

module.exports = validate;
