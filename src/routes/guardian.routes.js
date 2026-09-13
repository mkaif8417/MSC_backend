const express = require('express');
const Joi = require('joi');

const guardianController = require('../controllers/guardian.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router({ mergeParams: true });

const objectIdSchema = Joi.string().hex().length(24).messages({
  'string.length': 'Invalid ObjectId format (must be 24 hex characters)'
});

const studentIdParamSchema = Joi.object({
  studentId: objectIdSchema.required()
});

const guardianCreateSchema = Joi.object({
  studentId: objectIdSchema.required(),
  guardianName: Joi.string().required().trim().min(2).max(150),
  relationToStudent: Joi.string().trim().max(50),
  mobileNumber: Joi.string().trim().max(20),
  alternateMobileNumber: Joi.string().trim().max(20),
  address: Joi.string().trim().max(300)
});

// IMPORTANT: separate from the create schema. guardianName must NOT be
// required here, otherwise a partial update (e.g. only changing the
// mobile number) fails validation even though .min(1) allows it through.
const guardianUpdateSchema = Joi.object({
  guardianName: Joi.string().trim().min(2).max(150),
  relationToStudent: Joi.string().trim().max(50),
  mobileNumber: Joi.string().trim().max(20),
  alternateMobileNumber: Joi.string().trim().max(20),
  address: Joi.string().trim().max(300)
}).min(1);

// studentId comes from the parent route param; injected into body for the service layer
const injectStudentId = (req, res, next) => {
  req.body.studentId = req.params.studentId;
  next();
};

router.post(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.STUDENT_WRITE),
  validate({ params: studentIdParamSchema }),
  injectStudentId,
  validate({ body: guardianCreateSchema }),
  guardianController.createGuardian
);

router.get(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.STUDENT_READ),
  validate({ params: studentIdParamSchema }),
  guardianController.getGuardianByStudentId
);

router.patch(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.STUDENT_WRITE),
  validate({ params: studentIdParamSchema, body: guardianUpdateSchema }),
  guardianController.updateGuardian
);

module.exports = router;