const express = require('express');
const Joi = require('joi');

const mosqueController = require('../controllers/mosque.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

const objectIdSchema = Joi.string().hex().length(24).messages({
  'string.length': 'Invalid ObjectId format (must be 24 hex characters)'
});

const idParamSchema = {
  params: Joi.object({
    id: objectIdSchema.required()
  })
};

const mosqueCreateSchema = {
  body: Joi.object({
    name: Joi.string().required().trim().min(2).max(150),
    address: Joi.string().required().trim().min(3).max(300),
    pincode: Joi.string()
      .required()
      .trim()
      .pattern(/^[1-9][0-9]{5}$/)
      .messages({
        'string.pattern.base': 'Pincode must be a valid 6-digit Indian PIN code'
      }),
    areaLocalityId: objectIdSchema.required(),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    googleMapsUrl: Joi.string().trim().uri(),
    capacity: Joi.number().integer().min(0),
    inchargeName: Joi.string().trim().max(100),
    contactNumber: Joi.string().trim().max(20),
    isActive: Joi.boolean()
  })
};

const mosqueUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(150),
    address: Joi.string().trim().min(3).max(300),
    pincode: Joi.string()
      .trim()
      .pattern(/^[1-9][0-9]{5}$/)
      .messages({
        'string.pattern.base': 'Pincode must be a valid 6-digit Indian PIN code'
      }),
    areaLocalityId: objectIdSchema,
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    googleMapsUrl: Joi.string().trim().uri(),
    capacity: Joi.number().integer().min(0),
    inchargeName: Joi.string().trim().max(100),
    contactNumber: Joi.string().trim().max(20),
    isActive: Joi.boolean()
  }).min(1)
};

const mosqueQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    areaLocalityId: objectIdSchema,
    villageCityId: objectIdSchema,
    talukaId: objectIdSchema,
    districtId: objectIdSchema,
    isActive: Joi.string().valid('true', 'false'),
    search: Joi.string().trim().max(100)
  })
};

router.post(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.MOSQUE_CREATE),
  validate(mosqueCreateSchema),
  mosqueController.createMosque
);

router.get(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.MOSQUE_READ),
  validate(mosqueQuerySchema),
  mosqueController.getMosques
);

router.get(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.MOSQUE_READ),
  validate(idParamSchema),
  mosqueController.getMosqueById
);

router.patch(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.MOSQUE_UPDATE),
  validate(mosqueUpdateSchema),
  mosqueController.updateMosque
);

router.delete(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.MOSQUE_DELETE),
  validate(idParamSchema),
  mosqueController.deactivateMosque
);

module.exports = router;
