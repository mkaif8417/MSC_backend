const createBaseDao = require('./base.dao');
const Topic = require('../models/Topic');

const baseDao = createBaseDao(Topic);

const findOneLookup = async ({ subject, class: studentClass, pageNumber }) => {
  return baseDao.findOne({ subject, class: studentClass, pageNumber, isActive: true });
};

const findByClassAndSubject = async (studentClass, subject) => {
  return baseDao.findMany({ class: studentClass, subject, isActive: true }, { sort: { pageNumber: 1 } });
};

module.exports = {
  ...baseDao,
  findOneLookup,
  findByClassAndSubject
};