const talukaDao = require('../../daos/taluka.dao');
const districtDao = require('../../daos/district.dao');
const ERROR_CODES = require('../../constants/errorCodes');
const { ROLES } = require('../../constants/roles');

/**
 * Validate scope access for District Admin against parent District ID
 */
const validateDistrictScope = (userContext, districtId) => {
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    if (!allowedDistrictId || allowedDistrictId.toString() !== districtId.toString()) {
      const error = new Error('Access denied: You are not authorized to manage resources outside your assigned district');
      error.statusCode = 403;
      error.code = ERROR_CODES.FORBIDDEN;
      throw error;
    }
  }
};

/**
 * Create new Taluka
 */
const createTaluka = async (data, userContext) => {
  const { name, code, districtId } = data;

  // Scope check against parent districtId
  validateDistrictScope(userContext, districtId);

  // 1. Validate parent District exists
  const parentDistrict = await districtDao.findById(districtId);
  if (!parentDistrict) {
    const error = new Error(`Parent District with ID ${districtId} does not exist`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  // 2. Validate parent District is active
  if (!parentDistrict.isActive) {
    const error = new Error(`Cannot create taluka under inactive District "${parentDistrict.name}"`);
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  // 3. Check duplicate taluka name under same District
  const existingTaluka = await talukaDao.findByNameAndDistrict(name, districtId);
  if (existingTaluka) {
    const error = new Error(`Taluka "${name}" already exists under District "${parentDistrict.name}"`);
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  return talukaDao.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    districtId,
    isActive: data.isActive !== undefined ? data.isActive : true
  });
};

/**
 * Get talukas with district filtering & scope restriction
 */
const getTalukas = async (filter = {}, pagination = {}, userContext = null) => {
  const queryFilter = { ...filter };

  // Enforce District Admin scope
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    if (!allowedDistrictId) {
      queryFilter.districtId = null;
    } else {
      queryFilter.districtId = allowedDistrictId;
    }
  }

  return talukaDao.paginate(queryFilter, pagination);
};

/**
 * Get taluka by ID
 */
const getTalukaById = async (id, userContext = null) => {
  const taluka = await talukaDao.findById(id, null, { path: 'districtId', select: 'name code stateId isActive' });
  if (!taluka) {
    const error = new Error(`Taluka not found with ID ${id}`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  // Validate scope against parent district ID
  const parentDistrictId = taluka.districtId._id || taluka.districtId;
  validateDistrictScope(userContext, parentDistrictId);

  return taluka;
};

/**
 * Update taluka
 */
const updateTaluka = async (id, updateData, userContext = null) => {
  const existingTaluka = await getTalukaById(id, userContext);
  const districtId = updateData.districtId || existingTaluka.districtId._id || existingTaluka.districtId;

  validateDistrictScope(userContext, districtId);

  if (updateData.districtId) {
    const parentDistrict = await districtDao.findById(updateData.districtId);
    if (!parentDistrict || !parentDistrict.isActive) {
      const error = new Error(`Parent District with ID ${updateData.districtId} is invalid or inactive`);
      error.statusCode = 400;
      error.code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }
  }

  if (updateData.name) {
    const conflict = await talukaDao.findByNameAndDistrict(updateData.name, districtId);
    if (conflict && conflict._id.toString() !== id.toString()) {
      const error = new Error(`Taluka name "${updateData.name}" is already in use under this District`);
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
    updateData.name = updateData.name.trim();
  }

  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase().trim();
  }

  return talukaDao.updateById(id, updateData);
};

/**
 * Deactivate taluka (Soft deactivation)
 */
const deactivateTaluka = async (id, userContext = null) => {
  await getTalukaById(id, userContext);
  return talukaDao.updateById(id, { isActive: false });
};

module.exports = {
  validateDistrictScope,
  createTaluka,
  getTalukas,
  getTalukaById,
  updateTaluka,
  deactivateTaluka
};
