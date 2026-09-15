const createBaseDao = require('./base.dao');
const AcademicSheet = require('../models/AcademicSheet');

const baseDao = createBaseDao(AcademicSheet);

const findByStudentAndWeek = async (studentId, weekStartDate) => {
  return baseDao.findOne({ studentId, weekStartDate });
};

const findByStudyCenterAndWeek = async (studyCenterId, weekStartDate, options = {}) => {
  return baseDao.findMany({ studyCenterId, weekStartDate }, options);
};

const findByStudentId = async (studentId, options = {}) => {
  return baseDao.findMany({ studentId }, { sort: { weekStartDate: -1 }, ...options });
};

module.exports = {
  ...baseDao,
  findByStudentAndWeek,
  findByStudyCenterAndWeek,
  findByStudentId
};