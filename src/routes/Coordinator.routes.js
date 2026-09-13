const express = require('express');
const Joi = require('joi');

const coordinatorController = require('../controllers/coordinator.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

const objectIdSchema = Joi.string().hex().length(24).messages({
  'string.length': 'Invalid ObjectId format (must be 24 hex characters)'
});

const idParamSchema = { params: Joi.object({ id: objectIdSchema.required() }) };

const coordinatorCreateSchema = {
  body: Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    mobileNumber: Joi.string().required().trim().pattern(/^[6-9]\d{9}$/),
    qualification: Joi.string().trim().max(150),
    subjects: Joi.array().items(Joi.string().trim()),
    areaLocalityId: objectIdSchema.required(),
    studyCenterId: objectIdSchema.required(),
    joiningDate: Joi.date().required(),
    status: Joi.string().valid('Active', 'Inactive')
  })
};

const coordinatorUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    mobileNumber: Joi.string().trim().pattern(/^[6-9]\d{9}$/),
    qualification: Joi.string().trim().max(150),
    subjects: Joi.array().items(Joi.string().trim()),
    areaLocalityId: objectIdSchema,
    studyCenterId: objectIdSchema,
    joiningDate: Joi.date(),
    status: Joi.string().valid('Active', 'Inactive')
  }).min(1)
};

const coordinatorQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    studyCenterId: objectIdSchema,
    areaLocalityId: objectIdSchema,
    status: Joi.string().valid('Active', 'Inactive'),
    search: Joi.string().trim().max(100)
  })
};

const attendanceSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    date: Joi.date().required(),
    loginTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
    logoutTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
    status: Joi.string().valid('Present', 'Absent').required(),
    remarks: Joi.string().trim().max(300)
  })
};

const attendanceQuerySchema = {
  params: idParamSchema.params,
  query: Joi.object({ from: Joi.date(), to: Joi.date() })
};

const monthlyAttendanceQuerySchema = {
  params: idParamSchema.params,
  query: Joi.object({
    year: Joi.number().integer().min(2000).required(),
    month: Joi.number().integer().min(1).max(12).required()
  })
};

router.post('/', authenticate, requirePermissions(PERMISSIONS.COORDINATOR_CREATE), validate(coordinatorCreateSchema), coordinatorController.createCoordinator);
router.get('/', authenticate, requirePermissions(PERMISSIONS.COORDINATOR_READ), validate(coordinatorQuerySchema), coordinatorController.getCoordinators);
router.get('/:id', authenticate, requirePermissions(PERMISSIONS.COORDINATOR_READ), validate(idParamSchema), coordinatorController.getCoordinatorById);
router.patch('/:id', authenticate, requirePermissions(PERMISSIONS.COORDINATOR_UPDATE), validate(coordinatorUpdateSchema), coordinatorController.updateCoordinator);
router.delete('/:id', authenticate, requirePermissions(PERMISSIONS.COORDINATOR_DELETE), validate(idParamSchema), coordinatorController.deactivateCoordinator);

router.post('/:id/attendance', authenticate, requirePermissions(PERMISSIONS.COORDINATOR_ATTENDANCE_MANAGE), validate(attendanceSchema), coordinatorController.markAttendance);
router.get('/:id/attendance', authenticate, requirePermissions(PERMISSIONS.COORDINATOR_ATTENDANCE_READ), validate(attendanceQuerySchema), coordinatorController.getAttendance);
router.get('/:id/attendance/monthly-summary', authenticate, requirePermissions(PERMISSIONS.COORDINATOR_ATTENDANCE_READ), validate(monthlyAttendanceQuerySchema), coordinatorController.getMonthlyAttendance);

module.exports = router;