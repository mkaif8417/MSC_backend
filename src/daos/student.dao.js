const createBaseDao = require('./base.dao');
const Student = require('../models/Student');

const baseDao = createBaseDao(Student);

const findByStudyCenterId = async (studyCenterId, options = {}) => {
  if (!studyCenterId) return [];
  return baseDao.findMany({ studyCenterId }, options);
};

module.exports = {
  ...baseDao,
  findByStudyCenterId
};