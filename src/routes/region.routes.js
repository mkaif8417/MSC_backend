const express = require('express');
const Joi = require('joi');

const regionController = require('../controllers/region.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

const objectIdSchema = Joi.string().hex().length(24).messages({
  'string.length': 'Invalid ObjectId format (must be 24 hex characters)'
});

const idParamSchema = {
  params: Joi.object({ id: objectIdSchema.required() })
};

const regionCreateSchema = {
  body: Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    code: Joi.string().required().trim().min(2).max(10),
    divisionId: objectIdSchema.required(),
    isActive: Joi.boolean()
  })
};

const regionUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    code: Joi.string().trim().min(2).max(10),
    divisionId: objectIdSchema,
    isActive: Joi.boolean()
  }).min(1)
};

const regionQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    divisionId: objectIdSchema,
    isActive: Joi.string().valid('true', 'false'),
    search: Joi.string().trim().max(100)
  })
};

router.post(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.REGION_CREATE),
  validate(regionCreateSchema),
  regionController.createRegion
);

router.get(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.REGION_READ),
  validate(regionQuerySchema),
  regionController.getRegions
);

router.get(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.REGION_READ),
  validate(idParamSchema),
  regionController.getRegionById
);

router.patch(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.REGION_UPDATE),
  validate(regionUpdateSchema),
  regionController.updateRegion
);

router.delete(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.REGION_DELETE),
  validate(idParamSchema),
  regionController.deactivateRegion
);

module.exports = router;