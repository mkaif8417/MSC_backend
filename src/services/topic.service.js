const topicDao = require('../daos/topic.dao');
const ApiError = require('../utils/apiError');

const createTopic = async (payload) => {
  const existing = await topicDao.findOneLookup(payload);
  if (existing) {
    throw ApiError.conflict('A topic for this subject, class and page number already exists');
  }
  return topicDao.create(payload);
};

const updateTopic = async (id, payload) => {
  const topic = await topicDao.findById(id);
  if (!topic) throw ApiError.notFound('Topic not found');
  return topicDao.updateById(id, payload);
};

const getTopicsByClassSubject = async (studentClass, subject) => {
  return topicDao.findByClassAndSubject(studentClass, subject);
};

const lookupTopic = async ({ subject, class: studentClass, pageNumber }) => {
  const topic = await topicDao.findOneLookup({ subject, class: studentClass, pageNumber });
  if (!topic) {
    throw ApiError.notFound(`No topic set for ${subject} / ${studentClass} / page ${pageNumber}`);
  }
  return topic;
};

const deleteTopic = async (id) => {
  const topic = await topicDao.findById(id);
  if (!topic) throw ApiError.notFound('Topic not found');
  return topicDao.deleteById(id);
};

module.exports = {
  createTopic,
  updateTopic,
  getTopicsByClassSubject,
  lookupTopic,
  deleteTopic
};