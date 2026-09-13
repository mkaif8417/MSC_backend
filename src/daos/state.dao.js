const createBaseDao = require('./base.dao');
const State = require('../models/State');

const baseDao = createBaseDao(State);

const findByCode = async (code) => {
  if (!code) return null;
  return baseDao.findOne({ code: code.toUpperCase().trim() });
};

const findByName = async (name) => {
  if (!name) return null;
  return baseDao.findOne({ name: name.trim() });
};

module.exports = {
  ...baseDao,
  findByCode,
  findByName
};
