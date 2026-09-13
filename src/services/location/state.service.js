const stateDao = require('../../daos/state.dao');
const ERROR_CODES = require('../../constants/errorCodes');

/**
 * Create new State record
 */
const createState = async (data) => {
  const { name, code } = data;

  // Check duplicate code
  const existingCode = await stateDao.findByCode(code);
  if (existingCode) {
    const error = new Error(`State with code "${code.toUpperCase()}" already exists`);
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  // Check duplicate name
  const existingName = await stateDao.findByName(name);
  if (existingName) {
    const error = new Error(`State with name "${name}" already exists`);
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  return stateDao.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    isActive: data.isActive !== undefined ? data.isActive : true
  });
};

/**
 * Get all states with filtering & pagination
 */
const getStates = async (filter = {}, pagination = {}) => {
  const queryFilter = { ...filter };
  return stateDao.paginate(queryFilter, pagination);
};

/**
 * Get state by ID
 */
const getStateById = async (id) => {
  const state = await stateDao.findById(id);
  if (!state) {
    const error = new Error(`State not found with ID ${id}`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }
  return state;
};

/**
 * Update state by ID
 */
const updateState = async (id, updateData) => {
  await getStateById(id);

  if (updateData.code) {
    const existingCode = await stateDao.findByCode(updateData.code);
    if (existingCode && existingCode._id.toString() !== id.toString()) {
      const error = new Error(`State code "${updateData.code.toUpperCase()}" is already in use`);
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
    updateData.code = updateData.code.toUpperCase().trim();
  }

  if (updateData.name) {
    const existingName = await stateDao.findByName(updateData.name);
    if (existingName && existingName._id.toString() !== id.toString()) {
      const error = new Error(`State name "${updateData.name}" is already in use`);
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
    updateData.name = updateData.name.trim();
  }

  return stateDao.updateById(id, updateData);
};

/**
 * Deactivate state by ID (Soft deactivation)
 */
const deactivateState = async (id) => {
  await getStateById(id);
  return stateDao.updateById(id, { isActive: false });
};

module.exports = {
  createState,
  getStates,
  getStateById,
  updateState,
  deactivateState
};
