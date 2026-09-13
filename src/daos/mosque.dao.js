const createBaseDao = require('./base.dao');
const Mosque = require('../models/Mosque');

const baseDao = createBaseDao(Mosque);

/**
 * Find Mosques by Area/Locality ID
 */
const findByAreaLocality = async (areaLocalityId, projection = null, options = {}) => {
  return baseDao.findMany({ areaLocalityId }, projection, options);
};

/**
 * Find Mosque by name and Area/Locality ID (for duplicate check)
 */
const findByNameAndAreaLocality = async (name, areaLocalityId) => {
  const escapedName = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  return baseDao.findOne({
    areaLocalityId,
    name: new RegExp(`^${escapedName}$`, 'i')
  });
};

/**
 * Find a Mosque by its exact code (case-insensitive)
 */
const findByCode = async (code) => {
  const escapedCode = code.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  return baseDao.findOne({
    code: new RegExp(`^${escapedCode}$`, 'i')
  });
};

/**
 * Find all Mosques whose code matches a given prefix (e.g. "SH-"),
 * used to determine the next sequence number when generating a new code.
 */
const findByCodePrefix = async (prefix) => {
  const escapedPrefix = prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  return baseDao.findMany({
    code: new RegExp(`^${escapedPrefix}-\\d+$`, 'i')
  });
};

module.exports = {
  ...baseDao,
  findByAreaLocality,
  findByNameAndAreaLocality,
  findByCode,
  findByCodePrefix
};