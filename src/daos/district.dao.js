const createBaseDao = require('./base.dao');
const District = require('../models/District');

const baseDao = createBaseDao(District);

const findByState = async (stateId, filter = {}, options = {}) => {
  return baseDao.findMany({ ...filter, stateId }, options);
};

const findByNameAndState = async (name, stateId) => {
  if (!name || !stateId) return null;
  return baseDao.findOne({ stateId, name: name.trim() });
};

module.exports = {
  ...baseDao,
  findByState,
  findByNameAndState
};
