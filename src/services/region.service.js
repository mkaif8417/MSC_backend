const regionDao = require('../daos/region.dao');
const DivisionDao = require('../daos/DivisionDao');
const districtDao = require('../daos/district.dao');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Create new Region
 */
const createRegion = async (data) => {
  const { name, code, divisionId, isActive } = data;

  // 1. Validate parent Division exists
  const parentDivision = await divisionDao.findById(divisionId);
  if (!parentDivision) {
    const error = new Error(`Parent Division with ID ${divisionId} does not exist`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  // 2. Validate parent Division is active
  if (!parentDivision.isActive) {
    const error = new Error(`Cannot create region under inactive Division "${parentDivision.name}"`);
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  // 3. Check duplicate name under same Division
  const existingRegion = await regionDao.findByNameAndDivision(name, divisionId);
  if (existingRegion) {
    const error = new Error(`Region "${name}" already exists under Division "${parentDivision.name}"`);
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  // 4. Check duplicate code globally
  if (code) {
    const existingCode = await regionDao.findByCode(code);
    if (existingCode) {
      const error = new Error(`Region code "${code}" is already in use`);
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
  }

  return regionDao.create({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    divisionId,
    isActive: isActive !== undefined ? isActive : true
  });
};

/**
 * Get Regions with optional Division filter
 */
const getRegions = async (filter = {}, pagination = {}) => {
  const queryFilter = {};

  if (filter.isActive !== undefined) {
    queryFilter.isActive = filter.isActive;
  }

  if (filter.divisionId) {
    queryFilter.divisionId = filter.divisionId;
  }

  if (filter.search) {
    const searchRegex = new RegExp(filter.search, 'i');
    queryFilter.$or = [{ name: searchRegex }, { code: searchRegex }];
  }

  return regionDao.paginate(queryFilter, pagination);
};

/**
 * Get Region by ID
 */
const getRegionById = async (id) => {
  const region = await regionDao.findById(id, null, { path: 'divisionId', select: 'name code' });

  if (!region) {
    const error = new Error(`Region not found with ID ${id}`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  return region;
};

/**
 * Update Region
 */
const updateRegion = async (id, updateData) => {
  const existingRegion = await getRegionById(id);
  const targetDivisionId = updateData.divisionId || existingRegion.divisionId._id || existingRegion.divisionId;

  // If divisionId is changed, ensure target Division exists and is active
  if (updateData.divisionId) {
    const parentDivision = await divisionDao.findById(updateData.divisionId);
    if (!parentDivision || !parentDivision.isActive) {
      const error = new Error(`Parent Division with ID ${updateData.divisionId} is invalid or inactive`);
      error.statusCode = 400;
      error.code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }
  }

  // Check duplicate name under target Division
  if (updateData.name || updateData.divisionId) {
    const checkName = updateData.name || existingRegion.name;
    const conflict = await regionDao.findByNameAndDivision(checkName, targetDivisionId);
    if (conflict && conflict._id.toString() !== id.toString()) {
      const error = new Error(`Region name "${checkName}" is already in use under this Division`);
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
  }

  const formattedData = { ...updateData };
  if (formattedData.name) formattedData.name = formattedData.name.trim();
  if (formattedData.code) formattedData.code = formattedData.code.trim().toUpperCase();

  return regionDao.updateById(id, formattedData);
};

/**
 * Deactivate Region (Soft deactivation)
 * Blocks deactivation if any District still points at this Region and is active,
 * mirroring the parent-active-check pattern used elsewhere.
 */
const deactivateRegion = async (id) => {
  await getRegionById(id);

  const activeChildDistrict = await districtDao.findOne({ regionId: id, isActive: true });
  if (activeChildDistrict) {
    const error = new Error(
      `Cannot deactivate Region — it still has an active District "${activeChildDistrict.name}" under it`
    );
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  return regionDao.updateById(id, { isActive: false });
};

module.exports = {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deactivateRegion
};