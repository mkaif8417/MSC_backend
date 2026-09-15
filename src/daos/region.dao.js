const createBaseDao = require('./base.dao');
const Region = require('../models/Region');

const baseDao = createBaseDao(Region);

/**
 * Find Regions by Division ID
 */
const findByDivision = async (divisionId, projection = null, options = {}) => {
  return baseDao.findMany({ divisionId }, projection, options);
};

/**
 * Find Region by name and Division ID (for duplicate check)
 */
const findByNameAndDivision = async (name, divisionId) => {
  const escapedName = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  return baseDao.findOne({
    divisionId,
    name: new RegExp(`^${escapedName}$`, 'i')
  });
};

/**
 * Find a Region by its exact code (case-insensitive)
 */
const findByCode = async (code) => {
  const escapedCode = code.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  return baseDao.findOne({
    code: new RegExp(`^${escapedCode}$`, 'i')
  });
};

module.exports = {
  ...baseDao,
  findByDivision,
  findByNameAndDivision,
  findByCode
};