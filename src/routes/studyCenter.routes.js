const express = require('express');
const Joi = require('joi');

const studyCenterController = require('../controllers/studyCenter.controller');
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

const facilityItemSchema = Joi.object({
  available: Joi.boolean(),
  condition: Joi.string().valid('Good', 'Needs Repair', 'Not Available')
});

const facilitiesSchema = Joi.object({
  electricity: facilityItemSchema,
  fansAc: facilityItemSchema,
  lights: facilityItemSchema,
  internetWifi: facilityItemSchema,

  drinkingWater: facilityItemSchema,
  toilets: facilityItemSchema,
  libraryBooks: facilityItemSchema
});

const studyCenterCreateSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(150),
    mosqueId: objectIdSchema.required(),
    startDate: Joi.date().iso(),
    tablesCount: Joi.number().integer().min(0),
    chairsCount: Joi.number().integer().min(0),
    capacity: Joi.number().integer().min(0),
    roomsCount: Joi.number().integer().min(0),
    inchargeName: Joi.string().trim().max(100),
    contactNumber: Joi.string().trim().max(20),
    facilities: facilitiesSchema,
    grade: Joi.string().valid('C', 'C+', 'B', 'B+', 'B++', 'A', 'A++'),
    isActive: Joi.boolean()
  })
};

const studyCenterUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(150),
    mosqueId: Joi.any().forbidden().messages({
      'any.unknown': 'mosqueId is immutable and cannot be changed after Study Center creation'
    }),
    startDate: Joi.date().iso(),
    tablesCount: Joi.number().integer().min(0),
    chairsCount: Joi.number().integer().min(0),
    capacity: Joi.number().integer().min(0),
    roomsCount: Joi.number().integer().min(0),
    inchargeName: Joi.string().trim().max(100),
    contactNumber: Joi.string().trim().max(20),
    facilities: facilitiesSchema,
    grade: Joi.string().valid('C', 'C+', 'B', 'B+', 'B++', 'A', 'A++'),
    isActive: Joi.boolean()
  }).min(1)
};

const studyCenterQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    mosqueId: objectIdSchema,
    districtId: objectIdSchema,
    isActive: Joi.string().valid('true', 'false'),
    search: Joi.string().trim().max(100)
  })
};

router.post(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.STUDY_CENTER_CREATE),
  validate(studyCenterCreateSchema),
  studyCenterController.createStudyCenter
);

router.get(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.STUDY_CENTER_READ),
  validate(studyCenterQuerySchema),
  studyCenterController.getStudyCenters
);

router.get(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.STUDY_CENTER_READ),
  validate(idParamSchema),
  studyCenterController.getStudyCenterById
);

router.patch(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.STUDY_CENTER_UPDATE),
  validate(studyCenterUpdateSchema),
  studyCenterController.updateStudyCenter
);

router.delete(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.STUDY_CENTER_DELETE),
  validate(idParamSchema),
  studyCenterController.deactivateStudyCenter
);

module.exports = router;
