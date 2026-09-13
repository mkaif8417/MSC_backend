// ============================================================
// ADD near the top of location.routes.js, with the other controller requires:
// ============================================================
const divisionController = require('../controllers/location/division.controller');

// ============================================================
// ADD this whole block into location.routes.js — placement suggestion:
// right after the STATE ROUTES section and before DISTRICT ROUTES,
// since Division sits between State and District. Numbering below
// assumes it becomes section "1.5" — renumber the later sections
// (District becomes 2, Taluka 3, etc.) if you want tidy numbering,
// though Express doesn't care about the numbers either way.
// ============================================================

// ==============================================
// DIVISION ROUTES (/api/v1/locations/divisions)
// ==============================================

const divisionCreateSchema = {
  body: Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    code: Joi.string().required().trim().min(2).max(10),
    stateId: objectIdSchema.required(),
    hqDistrictId: objectIdSchema.allow(null, ''),
    isActive: Joi.boolean()
  })
};

const divisionUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    code: Joi.string().trim().min(2).max(10),
    stateId: objectIdSchema,
    hqDistrictId: objectIdSchema.allow(null, ''),
    isActive: Joi.boolean()
  }).min(1)
};

router.post('/divisions', authenticate, requirePermissions(PERMISSIONS.DIVISION_CREATE), validate(divisionCreateSchema), divisionController.createDivision);
router.get('/divisions', authenticate, requirePermissions(PERMISSIONS.DIVISION_READ), divisionController.getDivisions);
router.get('/divisions/:id', authenticate, requirePermissions(PERMISSIONS.DIVISION_READ), validate(idParamSchema), divisionController.getDivisionById);
router.get('/divisions/:id/districts', authenticate, requirePermissions(PERMISSIONS.DIVISION_READ), divisionController.getDistrictsByDivision);
router.get('/divisions/by-state/:stateId/districts', authenticate, requirePermissions(PERMISSIONS.DIVISION_READ), divisionController.getDistrictsByState);
router.patch('/divisions/:id', authenticate, requirePermissions(PERMISSIONS.DIVISION_UPDATE), validate(divisionUpdateSchema), divisionController.updateDivision);
router.delete('/divisions/:id', authenticate, requirePermissions(PERMISSIONS.DIVISION_DELETE), validate(idParamSchema), divisionController.deactivateDivision);