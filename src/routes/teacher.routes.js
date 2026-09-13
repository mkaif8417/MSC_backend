const express = require('express');
const Joi = require('joi');

const teacherController = require('../controllers/teacher.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

const objectIdSchema = Joi.string().hex().length(24).messages({
  'string.length': 'Invalid ObjectId format (must be 24 hex characters)'
});

const idParamSchema = { params: Joi.object({ id: objectIdSchema.required() }) };

const teacherCreateSchema = {
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

const teacherUpdateSchema = {
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

const teacherQuerySchema = {
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

const dailyReportSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    date: Joi.date().required(),
    reportText: Joi.string().required().trim().max(2000),
    issuesReported: Joi.string().trim().max(1000)
  })
};

router.post('/', authenticate, requirePermissions(PERMISSIONS.TEACHER_CREATE), validate(teacherCreateSchema), teacherController.createTeacher);
router.get('/', authenticate, requirePermissions(PERMISSIONS.TEACHER_READ), validate(teacherQuerySchema), teacherController.getTeachers);
router.get('/:id', authenticate, requirePermissions(PERMISSIONS.TEACHER_READ), validate(idParamSchema), teacherController.getTeacherById);
router.patch('/:id', authenticate, requirePermissions(PERMISSIONS.TEACHER_UPDATE), validate(teacherUpdateSchema), teacherController.updateTeacher);
router.delete('/:id', authenticate, requirePermissions(PERMISSIONS.TEACHER_DELETE), validate(idParamSchema), teacherController.deactivateTeacher);

router.post('/:id/attendance', authenticate, requirePermissions(PERMISSIONS.TEACHER_ATTENDANCE_MANAGE), validate(attendanceSchema), teacherController.markAttendance);
router.get('/:id/attendance', authenticate, requirePermissions(PERMISSIONS.TEACHER_ATTENDANCE_READ), validate(attendanceQuerySchema), teacherController.getAttendance);
router.get('/:id/attendance/monthly-summary', authenticate, requirePermissions(PERMISSIONS.TEACHER_ATTENDANCE_READ), validate(monthlyAttendanceQuerySchema), teacherController.getMonthlyAttendance);

router.post('/:id/daily-reports', authenticate, requirePermissions(PERMISSIONS.TEACHER_REPORT_MANAGE), validate(dailyReportSchema), teacherController.createDailyReport);
router.get('/:id/daily-reports', authenticate, requirePermissions(PERMISSIONS.TEACHER_REPORT_READ), validate(attendanceQuerySchema), teacherController.getDailyReports);

module.exports = router;