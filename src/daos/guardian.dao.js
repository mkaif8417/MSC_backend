const createBaseDao = require('./base.dao');
// NOTE: matches the naming convention used elsewhere (student.model.js),
// and avoids a case-sensitivity crash on Linux (require('../models/Guardian')
// would only work on case-insensitive filesystems like Windows/Mac).
const Guardian = require('../models/Guardian');

const baseDao = createBaseDao(Guardian);

const findByStudentId = async (studentId) => {
  if (!studentId) return null;
  return baseDao.findOne({ studentId });
};

module.exports = {
  ...baseDao,
  findByStudentId
};