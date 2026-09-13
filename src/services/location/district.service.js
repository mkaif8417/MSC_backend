const districtDao = require('../../daos/district.dao');
const stateDao = require('../../daos/state.dao');
const ERROR_CODES = require('../../constants/errorCodes');
const { ROLES } = require('../../constants/roles');

/**
 * Validate scope access for District Admin
 */
const validateDistrictScope = (userContext, districtId) => {
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    if (!allowedDistrictId || allowedDistrictId.toString() !== districtId.toString()) {
      const error = new Error('Access denied: You are not authorized to access resources outside your assigned district');
      error.statusCode = 403;
      error.code = ERROR_CODES.FORBIDDEN;
      throw error;
    }
  }
};

/**
 * Create new District
 */
const createDistrict = async (data, userContext) => {
  const { name, code, stateId } = data;

  // 1. Validate parent State exists
  const parentState = await stateDao.findById(stateId);
  if (!parentState) {
    const error = new Error(`Parent State with ID ${stateId} does not exist`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  // 2. Validate parent State is active
  if (!parentState.isActive) {
    const error = new Error(`Cannot create district under inactive State "${parentState.name}"`);
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  // 3. Check duplicate district name under same State
  const existingDistrict = await districtDao.findByNameAndState(name, stateId);
  if (existingDistrict) {
    const error = new Error(`District "${name}" already exists under state "${parentState.name}"`);
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  return districtDao.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    stateId,
    isActive: data.isActive !== undefined ? data.isActive : true
  });
};

/**
 * Get districts with state filtering & scope restriction
 */
const getDistricts = async (filter = {}, pagination = {}, userContext = null) => {
  const queryFilter = { ...filter };

  // Enforce District Admin scope
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    if (!allowedDistrictId) {
      queryFilter._id = null; // No district assigned -> empty list
    } else {
      queryFilter._id = allowedDistrictId;
    }
  }

  return districtDao.paginate(queryFilter, pagination);
};

/**
 * Get district by ID
 */
const getDistrictById = async (id, userContext = null) => {
  validateDistrictScope(userContext, id);

  const district = await districtDao.findById(id, null, { path: 'stateId', select: 'name code isActive' });
  if (!district) {
    const error = new Error(`District not found with ID ${id}`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  return district;
};

/**
 * Update district
 */
const updateDistrict = async (id, updateData, userContext = null) => {
  validateDistrictScope(userContext, id);
  const existingDistrict = await getDistrictById(id, userContext);

  const stateId = updateData.stateId || existingDistrict.stateId;

  if (updateData.stateId) {
    const parentState = await stateDao.findById(updateData.stateId);
    if (!parentState || !parentState.isActive) {
      const error = new Error(`Parent State with ID ${updateData.stateId} is invalid or inactive`);
      error.statusCode = 400;
      error.code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }
  }

  if (updateData.name) {
    const conflict = await districtDao.findByNameAndState(updateData.name, stateId);
    if (conflict && conflict._id.toString() !== id.toString()) {
      const error = new Error(`District name "${updateData.name}" is already in use under this State`);
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
    updateData.name = updateData.name.trim();
  }

  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase().trim();
  }

  return districtDao.updateById(id, updateData);
};

/**
 * Deactivate district (Soft deactivation)
 */
const deactivateDistrict = async (id, userContext = null) => {
  validateDistrictScope(userContext, id);
  await getDistrictById(id, userContext);
  return districtDao.updateById(id, { isActive: false });
};

module.exports = {
  validateDistrictScope,
  createDistrict,
  getDistricts,
  getDistrictById,
  updateDistrict,
  deactivateDistrict
};
