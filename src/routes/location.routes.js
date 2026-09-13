const express = require('express');
const Joi = require('joi');

const stateController = require('../controllers/location/state.controller');
const divisionController = require('../controllers/DivisionController');
const districtController = require('../controllers/location/district.controller');
const talukaController = require('../controllers/location/taluka.controller');
const villageCityController = require('../controllers/location/villageCity.controller');
const areaLocalityController = require('../controllers/location/areaLocality.controller');

const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

const objectIdSchema = Joi.string().hex().length(24).messages({
  'string.length': 'Invalid ObjectId format (must be 24 hex characters)'
});

// Common Params Validation
const idParamSchema = {
  params: Joi.object({
    id: objectIdSchema.required()
  })
};

// ==========================================
// 1. STATE ROUTES (/api/v1/locations/states)
// ==========================================

const stateCreateSchema = {
  body: Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    code: Joi.string().required().trim().min(2).max(10),
    isActive: Joi.boolean()
  })
};

const stateUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    code: Joi.string().trim().min(2).max(10),
    isActive: Joi.boolean()
  }).min(1)
};

router.post('/states', authenticate, requirePermissions(PERMISSIONS.STATE_CREATE), validate(stateCreateSchema), stateController.createState);
router.get('/states', authenticate, requirePermissions(PERMISSIONS.STATE_READ), stateController.getStates);
router.get('/states/:id', authenticate, requirePermissions(PERMISSIONS.STATE_READ), validate(idParamSchema), stateController.getStateById);
router.patch('/states/:id', authenticate, requirePermissions(PERMISSIONS.STATE_UPDATE), validate(stateUpdateSchema), stateController.updateState);
router.delete('/states/:id', authenticate, requirePermissions(PERMISSIONS.STATE_DELETE), validate(idParamSchema), stateController.deactivateState);

// ==========================================
// 2. DIVISION ROUTES (/api/v1/locations/divisions)
// ==========================================

const divisionCreateSchema = {
  body: Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    code: Joi.string().required().trim().min(2).max(10),
    stateId: objectIdSchema.required(),
    hqDistrictId: objectIdSchema.allow(null),
    isActive: Joi.boolean()
  })
};

const divisionUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    code: Joi.string().trim().min(2).max(10),
    stateId: objectIdSchema,
    hqDistrictId: objectIdSchema.allow(null),
    isActive: Joi.boolean()
  }).min(1)
};

router.post('/divisions', authenticate, requirePermissions(PERMISSIONS.DIVISION_CREATE), validate(divisionCreateSchema), divisionController.createDivision);
router.get('/divisions', authenticate, requirePermissions(PERMISSIONS.DIVISION_READ), divisionController.getDivisions);
router.get('/divisions/:id', authenticate, requirePermissions(PERMISSIONS.DIVISION_READ), validate(idParamSchema), divisionController.getDivisionById);
router.patch('/divisions/:id', authenticate, requirePermissions(PERMISSIONS.DIVISION_UPDATE), validate(divisionUpdateSchema), divisionController.updateDivision);
router.delete('/divisions/:id', authenticate, requirePermissions(PERMISSIONS.DIVISION_DELETE), validate(idParamSchema), divisionController.deactivateDivision);

// Cascading helper routes used by dropdowns
router.get('/divisions/:id/districts', authenticate, requirePermissions(PERMISSIONS.DISTRICT_READ), validate(idParamSchema), divisionController.getDistrictsByDivision);
router.get('/divisions/by-state/:stateId/districts', authenticate, requirePermissions(PERMISSIONS.DISTRICT_READ), divisionController.getDistrictsByState);

// ==============================================
// 3. DISTRICT ROUTES (/api/v1/locations/districts)
// ==============================================

const districtCreateSchema = {
  body: Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    code: Joi.string().required().trim().min(2).max(10),
    stateId: objectIdSchema.required(),
    isActive: Joi.boolean()
  })
};

const districtUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    code: Joi.string().trim().min(2).max(10),
    stateId: objectIdSchema,
    isActive: Joi.boolean()
  }).min(1)
};

router.post('/districts', authenticate, requirePermissions(PERMISSIONS.DISTRICT_CREATE), validate(districtCreateSchema), districtController.createDistrict);
router.get('/districts', authenticate, requirePermissions(PERMISSIONS.DISTRICT_READ), districtController.getDistricts);
router.get('/districts/:id', authenticate, requirePermissions(PERMISSIONS.DISTRICT_READ), validate(idParamSchema), districtController.getDistrictById);
router.patch('/districts/:id', authenticate, requirePermissions(PERMISSIONS.DISTRICT_UPDATE), validate(districtUpdateSchema), districtController.updateDistrict);
router.delete('/districts/:id', authenticate, requirePermissions(PERMISSIONS.DISTRICT_DELETE), validate(idParamSchema), districtController.deactivateDistrict);

// ============================================
// 4. TALUKA ROUTES (/api/v1/locations/talukas)
// ============================================

const talukaCreateSchema = {
  body: Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    code: Joi.string().required().trim().min(2).max(10),
    districtId: objectIdSchema.required(),
    isActive: Joi.boolean()
  })
};

const talukaUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    code: Joi.string().trim().min(2).max(10),
    districtId: objectIdSchema,
    isActive: Joi.boolean()
  }).min(1)
};

router.post('/talukas', authenticate, requirePermissions(PERMISSIONS.TALUKA_CREATE), validate(talukaCreateSchema), talukaController.createTaluka);
router.get('/talukas', authenticate, requirePermissions(PERMISSIONS.TALUKA_READ), talukaController.getTalukas);
router.get('/talukas/:id', authenticate, requirePermissions(PERMISSIONS.TALUKA_READ), validate(idParamSchema), talukaController.getTalukaById);
router.patch('/talukas/:id', authenticate, requirePermissions(PERMISSIONS.TALUKA_UPDATE), validate(talukaUpdateSchema), talukaController.updateTaluka);
router.delete('/talukas/:id', authenticate, requirePermissions(PERMISSIONS.TALUKA_DELETE), validate(idParamSchema), talukaController.deactivateTaluka);

// ====================================================
// 5. VILLAGE/CITY ROUTES (/api/v1/locations/villages-cities)
// ====================================================
const villageCityCreateSchema = {
  body: Joi.object({
    villageCityName: Joi.string().required().trim().min(2).max(100),
    code: Joi.string().required().trim().min(2).max(10),
    talukaId: objectIdSchema.required(),
    type: Joi.string().valid('VILLAGE', 'CITY'),
    isActive: Joi.boolean()
  })
};

const villageCityUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    villageCityName: Joi.string().trim().min(2).max(100),
    code: Joi.string().trim().min(2).max(10),
    talukaId: objectIdSchema,
    type: Joi.string().valid('VILLAGE', 'CITY'),
    isActive: Joi.boolean()
  }).min(1)
};

router.post('/villages-cities', authenticate, requirePermissions(PERMISSIONS.VILLAGE_CITY_CREATE), validate(villageCityCreateSchema), villageCityController.createVillageCity);
router.get('/villages-cities', authenticate, requirePermissions(PERMISSIONS.VILLAGE_CITY_READ), villageCityController.getVillagesCities);
router.get('/villages-cities/:id', authenticate, requirePermissions(PERMISSIONS.VILLAGE_CITY_READ), validate(idParamSchema), villageCityController.getVillageCityById);
router.patch('/villages-cities/:id', authenticate, requirePermissions(PERMISSIONS.VILLAGE_CITY_UPDATE), validate(villageCityUpdateSchema), villageCityController.updateVillageCity);
router.delete('/villages-cities/:id', authenticate, requirePermissions(PERMISSIONS.VILLAGE_CITY_DELETE), validate(idParamSchema), villageCityController.deactivateVillageCity);

// =======================================================
// 6. AREA/LOCALITY ROUTES (/api/v1/locations/areas-localities)
// =======================================================

const areaLocalityCreateSchema = {
  body: Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    code: Joi.string().required().trim().min(2).max(10),
    villageCityId: objectIdSchema.required(),
    pincode: Joi.string().trim().max(10),
    isActive: Joi.boolean()
  })
};

const areaLocalityUpdateSchema = {
  params: idParamSchema.params,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    code: Joi.string().trim().min(2).max(10),
    villageCityId: objectIdSchema,
    pincode: Joi.string().trim().max(10),
    isActive: Joi.boolean()
  }).min(1)
};

router.post('/areas-localities', authenticate, requirePermissions(PERMISSIONS.AREA_LOCALITY_CREATE), validate(areaLocalityCreateSchema), areaLocalityController.createAreaLocality);
router.get('/areas-localities', authenticate, requirePermissions(PERMISSIONS.AREA_LOCALITY_READ), areaLocalityController.getAreasLocalities);
router.get('/areas-localities/:id', authenticate, requirePermissions(PERMISSIONS.AREA_LOCALITY_READ), validate(idParamSchema), areaLocalityController.getAreaLocalityById);
router.patch('/areas-localities/:id', authenticate, requirePermissions(PERMISSIONS.AREA_LOCALITY_UPDATE), validate(areaLocalityUpdateSchema), areaLocalityController.updateAreaLocality);
router.delete('/areas-localities/:id', authenticate, requirePermissions(PERMISSIONS.AREA_LOCALITY_DELETE), validate(idParamSchema), areaLocalityController.deactivateAreaLocality);

const mosqueRoutes = require('./mosque.routes');

router.use('/mosques', mosqueRoutes);

module.exports = router;