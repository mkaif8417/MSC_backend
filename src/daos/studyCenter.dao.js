const createBaseDao = require('./base.dao');
const StudyCenter = require('../models/StudyCenter');

const baseDao = createBaseDao(StudyCenter);

/**
 * Find Study Center by Mosque ID (for 1-to-1 lookup)
 * @param {String|ObjectId} mosqueId Mosque ID
 * @returns {Promise<Object|null>} Study Center document
 */
const findByMosqueId = async (mosqueId) => {
  if (!mosqueId) return null;
  return baseDao.findOne({ mosqueId });
};

module.exports = {
  ...baseDao,
  findByMosqueId
};
