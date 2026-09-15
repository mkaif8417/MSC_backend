const Joi = require('joi');
const objectIdParamSchema = Joi.object({id: Joi.string().hex().length(24).required()
});

const createTopicSchema = Joi.object({
  subject: Joi.string().valid('Maths', 'Urdu', 'English').required(),
  class: Joi.string().valid('8th', '9th', '10th').required(),
  pageNumber: Joi.number().integer().min(1).required(),
  topic: Joi.string().trim().min(1).required()
});

const updateTopicSchema = Joi.object({
  topic: Joi.string().trim().min(1),
  isActive: Joi.boolean()
}).min(1);

const lookupTopicQuerySchema = Joi.object({
  subject: Joi.string().valid('Maths', 'Urdu', 'English').required(),
  class: Joi.string().valid('8th', '9th', '10th').required(),
  pageNumber: Joi.number().integer().min(1).required()
});

module.exports = {
  createTopicSchema,
  updateTopicSchema,
  lookupTopicQuerySchema,
  objectIdParamSchema
};