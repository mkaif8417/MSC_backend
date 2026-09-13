const areaLocalityDao = require('../../daos/areaLocality.dao');
const villageCityDao = require('../../daos/villageCity.dao');
const talukaDao = require('../../daos/taluka.dao');
const ERROR_CODES = require('../../constants/errorCodes');
const { ROLES } = require('../../constants/roles');

/**
 * Traverse up to parent District ID to validate scope for District Admin
 */
const validateDistrictScopeByVillageCityId = async (userContext, villageCityId) => {
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    const villageCity = await villageCityDao.findById(villageCityId, null, { path: 'talukaId' });

    if (!villageCity || !villageCity.talukaId || !allowedDistrictId) {
      const error = new Error('Access denied: You are not authorized to manage resources outside your assigned district');
      error.statusCode = 403;
      error.code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    const talukaDistrictId = villageCity.talukaId.districtId;
    if (talukaDistrictId.toString() !== allowedDistrictId.toString()) {
      const error = new Error('Access denied: You are not authorized to manage resources outside your assigned district');
      error.statusCode = 403;
      error.code = ERROR_CODES.FORBIDDEN;
      throw error;
    }
  }
};

/**
 * Create new Area/Locality
 */
const createAreaLocality = async (data, userContext) => {
  const { name, code, villageCityId, pincode } = data;

  // 1. Validate parent VillageCity exists
  const parentVillageCity = await villageCityDao.findById(villageCityId);
  if (!parentVillageCity) {
    const error = new Error(`Parent Village/City with ID ${villageCityId} does not exist`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  // 2. Validate scope hierarchy up to District
  await validateDistrictScopeByVillageCityId(userContext, villageCityId);

  // 3. Validate parent VillageCity is active
  if (!parentVillageCity.isActive) {
    const error = new Error(`Cannot create area/locality under inactive Village/City "${parentVillageCity.name}"`);
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  // 4. Check duplicate name under same VillageCity
  const existingArea = await areaLocalityDao.findByNameAndVillageCity(name, villageCityId);
  if (existingArea) {
    const error = new Error(`Area/Locality "${name}" already exists under Village/City "${parentVillageCity.name}"`);
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  return areaLocalityDao.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    villageCityId,
    pincode: pincode ? pincode.trim() : undefined,
    isActive: data.isActive !== undefined ? data.isActive : true
  });
};

/**
 * Get areas/localities with villageCity filtering & scope restriction
 */
const getAreasLocalities = async (filter = {}, pagination = {}, userContext = null) => {
  const queryFilter = { ...filter };

  // Enforce District Admin scope by resolving allowed VillageCity IDs under user's district
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    if (!allowedDistrictId) {
      queryFilter.villageCityId = null;
    } else {
      const districtTalukas = await talukaDao.findByDistrict(allowedDistrictId);
      const talukaIds = districtTalukas.map((t) => t._id);
      const districtVillages = await villageCityDao.findMany({ talukaId: { $in: talukaIds } });
      const villageCityIds = districtVillages.map((v) => v._id);

      if (queryFilter.villageCityId) {
        // If query specifies villageCityId, ensure it belongs to user's district
        if (!villageCityIds.some((id) => id.toString() === queryFilter.villageCityId.toString())) {
          queryFilter.villageCityId = null; // Unauthorized filter -> return empty
        }
      } else {
        queryFilter.villageCityId = { $in: villageCityIds };
      }
    }
  }

  return areaLocalityDao.paginate(queryFilter, pagination);
};

/**
 * Get area/locality by ID
 */
const getAreaLocalityById = async (id, userContext = null) => {
  const areaLocality = await areaLocalityDao.findById(id, null, { path: 'villageCityId', select: 'name code talukaId isActive' });
  if (!areaLocality) {
    const error = new Error(`Area/Locality not found with ID ${id}`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  // NOTE: villageCityId can populate to null if the referenced Village/City
  // document was deleted directly (e.g. removed from the Atlas UI) rather
  // than through the app's soft-delete flow. Optional chaining here avoids
  // crashing on those orphaned records; validateDistrictScopeByVillageCityId
  // below already handles a null/missing villageCity safely for District Admins.
  const parentVillageCityId = areaLocality.villageCityId?._id || areaLocality.villageCityId;
  await validateDistrictScopeByVillageCityId(userContext, parentVillageCityId);

  return areaLocality;
};

/**
 * Update area/locality
 */
const updateAreaLocality = async (id, updateData, userContext = null) => {
  const existingArea = await getAreaLocalityById(id, userContext);
  const villageCityId = updateData.villageCityId || existingArea.villageCityId?._id || existingArea.villageCityId;

  await validateDistrictScopeByVillageCityId(userContext, villageCityId);

  if (updateData.villageCityId) {
    const parentVillageCity = await villageCityDao.findById(updateData.villageCityId);
    if (!parentVillageCity || !parentVillageCity.isActive) {
      const error = new Error(`Parent Village/City with ID ${updateData.villageCityId} is invalid or inactive`);
      error.statusCode = 400;
      error.code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }
  }

  if (updateData.name) {
    const conflict = await areaLocalityDao.findByNameAndVillageCity(updateData.name, villageCityId);
    if (conflict && conflict._id.toString() !== id.toString()) {
      const error = new Error(`Area/Locality name "${updateData.name}" is already in use under this Village/City`);
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
    updateData.name = updateData.name.trim();
  }

  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase().trim();
  }

  if (updateData.pincode) {
    updateData.pincode = updateData.pincode.trim();
  }

  return areaLocalityDao.updateById(id, updateData);
};

/**
 * Deactivate area/locality (Soft deactivation)
 */
const deactivateAreaLocality = async (id, userContext = null) => {
  await getAreaLocalityById(id, userContext);
  return areaLocalityDao.updateById(id, { isActive: false });
};

module.exports = {
  validateDistrictScopeByVillageCityId,
  createAreaLocality,
  getAreasLocalities,
  getAreaLocalityById,
  updateAreaLocality,
  deactivateAreaLocality
};