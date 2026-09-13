const createBaseDao = require('./base.dao');
const AreaLocality = require('../models/AreaLocality');

const baseDao = createBaseDao(AreaLocality);

const findByVillageCity = async (villageCityId, filter = {}, options = {}) => {
  return baseDao.findMany({ ...filter, villageCityId }, options);
};

const findByNameAndVillageCity = async (name, villageCityId) => {
  if (!name || !villageCityId) return null;
  return baseDao.findOne({ villageCityId, name: name.trim() });
};

module.exports = {
  ...baseDao,
  findByVillageCity,
  findByNameAndVillageCity
};
