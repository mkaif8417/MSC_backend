const express = require('express');
const Joi = require('joi');

const studentController = require('../controllers/student.controller');
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

const classDependentFields = {
  class: Joi.string().valid('8th', '9th', '10th', '11th', '12th', 'Degree').required(),
  courseType: Joi.string()
    .valid('AICU', 'Special Course', 'Self Study')
    .when('class', {
      is: Joi.valid('8th', '9th', '10th'),
      then: Joi.valid('AICU', 'Self Study').required(),
      otherwise: Joi.valid('Self Study', 'Special Course').required() // 11th/12th/Degree
    })
};

const studentCreateSchema = {
  body: Joi.object({
    name: Joi.string().required().trim().min(2).max(150),
    fatherGuardianName: Joi.string().required().trim().min(2).max(150),
    mobileNumber: Joi.string().trim().max(20),
    age: Joi.number().integer().min(0).max(120),
    studyCenterId: objectIdSchema.required(),
    villageLocality: Joi.string().trim().max(150),
    schoolCollegeName: Joi.string().trim().max(200),
    currentEducationalLevel: Joi.string().trim().max(100),
    ...classDependentFields,
    isActive: Joi.boolean()
  })
};

const studentUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(150),
    fatherGuardianName: Joi.string().trim().min(2).max(150),
    mobileNumber: Joi.string().trim().max(20),
    age: Joi.number().integer().min(0).max(120),
    studyCenterId: Joi.any().forbidden().messages({
      'any.unknown': 'studyCenterId is immutable and cannot be changed after Student creation'
    }),
    villageLocality: Joi.string().trim().max(150),
    schoolCollegeName: Joi.string().trim().max(200),
    currentEducationalLevel: Joi.string().trim().max(100),
    class: Joi.string().valid('8th', '9th', '10th', '11th', '12th', 'Degree'),
    courseType: Joi.string().valid('AICU', 'Special Course', 'Self Study'),
    isActive: Joi.boolean()
  }).min(1)
};

const studentQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    studyCenterId: objectIdSchema,
    class: Joi.string().valid('8th', '9th', '10th', '11th', '12th', 'Degree'),
    isActive: Joi.string().valid('true', 'false'),
    search: Joi.string().trim().max(100)
  })
};

router.post('/', authenticate, requirePermissions(PERMISSIONS.STUDENT_WRITE), validate(studentCreateSchema), studentController.createStudent);
router.get('/', authenticate, requirePermissions(PERMISSIONS.STUDENT_READ), validate(studentQuerySchema), studentController.getStudents);
router.get('/:id', authenticate, requirePermissions(PERMISSIONS.STUDENT_READ), validate(idParamSchema), studentController.getStudentById);
router.patch('/:id', authenticate, requirePermissions(PERMISSIONS.STUDENT_WRITE), validate(studentUpdateSchema), studentController.updateStudent);
router.delete('/:id', authenticate, requirePermissions(PERMISSIONS.STUDENT_WRITE), validate(idParamSchema), studentController.deleteStudent);

const guardianRoutes = require('./guardian.routes');
const attendanceRoutes = require('./studentAttendance.routes');

router.use('/:studentId/guardian', guardianRoutes);
router.use('/:studentId/attendance', attendanceRoutes);

module.exports = router;