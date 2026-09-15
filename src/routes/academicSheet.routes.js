const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../constants/permissions');
const academicSheetController = require('../controllers/academicSheet.controller');
const {
  createSheetSchema,
  addDailyEntrySchema,
  updateWeeklyResultSchema,
  objectIdParamSchema,
  studentIdParamSchema
} = require('../middlewares/academicSheet.validator');

router.use(authenticate);

router.post('/', requirePermissions(PERMISSIONS.ACADEMIC_WRITE), validate({ body: createSheetSchema }), academicSheetController.createWeeklySheet);
router.post('/:id/daily-entry', requirePermissions(PERMISSIONS.ACADEMIC_WRITE), validate({ params: objectIdParamSchema, body: addDailyEntrySchema }), academicSheetController.addDailyEntry);
router.patch('/:id/weekly-result', requirePermissions(PERMISSIONS.ACADEMIC_WRITE), validate({ params: objectIdParamSchema, body: updateWeeklyResultSchema }), academicSheetController.updateWeeklyResult);
router.get('/:id', requirePermissions(PERMISSIONS.ACADEMIC_READ), validate({ params: objectIdParamSchema }), academicSheetController.getSheetById);
router.get('/student/:studentId', requirePermissions(PERMISSIONS.ACADEMIC_READ), validate({ params: studentIdParamSchema }), academicSheetController.getSheetsByStudent);

module.exports = router;