const express = require('express');
const Joi = require('joi');

const studentAttendanceController = require('../controllers/studentAttendance.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router({ mergeParams: true });

const markAttendanceSchema = Joi.object({
  date: Joi.date().required(),
  status: Joi.string().valid('PRESENT', 'ABSENT').required(),
  loginTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null, ''),
  logoutTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null, ''),
  attendanceType: Joi.string().valid('REGULAR', 'IRREGULAR'),
  remarks: Joi.string().trim().max(300).allow(null, '')
});

const updateAttendanceSchema = Joi.object({
  status: Joi.string().valid('PRESENT', 'ABSENT'),
  loginTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null, ''),
  logoutTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null, ''),
  attendanceType: Joi.string().valid('REGULAR', 'IRREGULAR'),
  remarks: Joi.string().trim().max(300).allow(null, '')
}).min(1);

// POST /students/:studentId/attendance
router.post(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.STUDENT_WRITE),
  validate({ body: markAttendanceSchema }),
  studentAttendanceController.markAttendance
);

// GET /students/:studentId/attendance?startDate=...&endDate=...
router.get(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.STUDENT_READ),
  validate({
    query: Joi.object({
      startDate: Joi.date().required(),
      endDate: Joi.date().required()
    })
  }),
  studentAttendanceController.getAttendanceRange
);

// GET /students/:studentId/attendance/monthly?year=2026&month=9
router.get(
  '/monthly',
  authenticate,
  requirePermissions(PERMISSIONS.STUDENT_READ),
  validate({
    query: Joi.object({
      year: Joi.number().integer().min(2000).max(2100).required(),
      month: Joi.number().integer().min(1).max(12).required()
    })
  }),
  studentAttendanceController.getMonthlyAttendance
);

// PATCH /students/:studentId/attendance/:attendanceId
router.patch(
  '/:attendanceId',
  authenticate,
  requirePermissions(PERMISSIONS.STUDENT_WRITE),
  validate({ body: updateAttendanceSchema }),
  studentAttendanceController.updateAttendance
);

module.exports = router;