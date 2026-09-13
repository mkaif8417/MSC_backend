const createBaseDao = require('./base.dao');
const VillageCity = require('../models/VillageCity');

const baseDao = createBaseDao(VillageCity);

const findByTaluka = async (talukaId, filter = {}, options = {}) => {
  return baseDao.findMany({ ...filter, talukaId }, options);
};

const findByNameAndTaluka = async (villageCityName, talukaId) => {
  if (!villageCityName || !talukaId) return null;
  return baseDao.findOne({ talukaId, villageCityName: villageCityName.trim() });
};

module.exports = {
  ...baseDao,
  findByTaluka,
  findByNameAndTaluka
};