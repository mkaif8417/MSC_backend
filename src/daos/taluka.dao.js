const createBaseDao = require('./base.dao');
const Taluka = require('../models/Taluka');

const baseDao = createBaseDao(Taluka);

const findByDistrict = async (districtId, filter = {}, options = {}) => {
  return baseDao.findMany({ ...filter, districtId }, options);
};

const findByNameAndDistrict = async (name, districtId) => {
  if (!name || !districtId) return null;
  return baseDao.findOne({ districtId, name: name.trim() });
};

module.exports = {
  ...baseDao,
  findByDistrict,
  findByNameAndDistrict
};
