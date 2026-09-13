const villageCityDao = require('../../daos/villageCity.dao');
const talukaDao = require('../../daos/taluka.dao');
const ERROR_CODES = require('../../constants/errorCodes');
const { ROLES } = require('../../constants/roles');

/**
 * Traverse up to parent District ID to validate scope for District Admin
 */
const validateDistrictScopeByTalukaId = async (userContext, talukaId) => {
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    const taluka = await talukaDao.findById(talukaId);

    if (!taluka || !allowedDistrictId || taluka.districtId.toString() !== allowedDistrictId.toString()) {
      const error = new Error('Access denied: You are not authorized to manage resources outside your assigned district');
      error.statusCode = 403;
      error.code = ERROR_CODES.FORBIDDEN;
      throw error;
    }
  }
};

/**
 * Create new Village/City
 */
const createVillageCity = async (data, userContext) => {
  const { villageCityName, code, talukaId, type } = data;

  // 1. Validate parent Taluka exists
  const parentTaluka = await talukaDao.findById(talukaId);
  if (!parentTaluka) {
    const error = new Error(`Parent Taluka with ID ${talukaId} does not exist`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  // 2. Validate scope hierarchy up to District
  await validateDistrictScopeByTalukaId(userContext, talukaId);

  // 3. Validate parent Taluka is active
  if (!parentTaluka.isActive) {
    const error = new Error(`Cannot create village/city under inactive Taluka "${parentTaluka.name}"`);
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  // 4. Check duplicate name under same Taluka
  const existingVillageCity = await villageCityDao.findByNameAndTaluka(villageCityName, talukaId);
  if (existingVillageCity) {
    const error = new Error(`Village/City "${villageCityName}" already exists under Taluka "${parentTaluka.name}"`);
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  return villageCityDao.create({
    villageCityName: villageCityName.trim(),
    code: code.toUpperCase().trim(),
    talukaId,
    type: type || 'VILLAGE',
    isActive: data.isActive !== undefined ? data.isActive : true
  });
};

/**
 * Get villages/cities with taluka filtering & scope restriction
 */
const getVillagesCities = async (filter = {}, pagination = {}, userContext = null) => {
  const queryFilter = { ...filter };

  // Enforce District Admin scope by resolving allowed Taluka IDs under user's district
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    if (!allowedDistrictId) {
      queryFilter.talukaId = null;
    } else {
      const districtTalukas = await talukaDao.findByDistrict(allowedDistrictId);
      const talukaIds = districtTalukas.map((t) => t._id);

      if (queryFilter.talukaId) {
        // If query specifies talukaId, ensure it's in user's district
        if (!talukaIds.some((id) => id.toString() === queryFilter.talukaId.toString())) {
          queryFilter.talukaId = null; // Unauthorized taluka filter -> return empty
        }
      } else {
        queryFilter.talukaId = { $in: talukaIds };
      }
    }
  }

  return villageCityDao.paginate(queryFilter, pagination);
};

/**
 * Get village/city by ID
 */
const getVillageCityById = async (id, userContext = null) => {
  const villageCity = await villageCityDao.findById(id, null, { path: 'talukaId', select: 'name code districtId isActive' });
  if (!villageCity) {
    const error = new Error(`Village/City not found with ID ${id}`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  const parentTalukaId = villageCity.talukaId._id || villageCity.talukaId;
  await validateDistrictScopeByTalukaId(userContext, parentTalukaId);

  return villageCity;
};

/**
 * Update village/city
 */
const updateVillageCity = async (id, updateData, userContext = null) => {
  const existingVC = await getVillageCityById(id, userContext);
  const talukaId = updateData.talukaId || existingVC.talukaId._id || existingVC.talukaId;

  await validateDistrictScopeByTalukaId(userContext, talukaId);

  if (updateData.talukaId) {
    const parentTaluka = await talukaDao.findById(updateData.talukaId);
    if (!parentTaluka || !parentTaluka.isActive) {
      const error = new Error(`Parent Taluka with ID ${updateData.talukaId} is invalid or inactive`);
      error.statusCode = 400;
      error.code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }
  }

  if (updateData.villageCityName) {
    const conflict = await villageCityDao.findByNameAndTaluka(updateData.villageCityName, talukaId);
    if (conflict && conflict._id.toString() !== id.toString()) {
      const error = new Error(`Village/City name "${updateData.villageCityName}" is already in use under this Taluka`);
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
    updateData.villageCityName = updateData.villageCityName.trim();
  }

  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase().trim();
  }

  return villageCityDao.updateById(id, updateData);
};

/**
 * Deactivate village/city (Soft deactivation)
 */
const deactivateVillageCity = async (id, userContext = null) => {
  await getVillageCityById(id, userContext);
  return villageCityDao.updateById(id, { isActive: false });
};

module.exports = {
  validateDistrictScopeByTalukaId,
  createVillageCity,
  getVillagesCities,
  getVillageCityById,
  updateVillageCity,
  deactivateVillageCity
};