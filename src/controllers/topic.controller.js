const asyncHandler = require('../utils/asyncHandler'); // adjust name/path if yours differs
const ApiResponse = require('../utils/apiResponse');
const topicService = require('../services/topic.service');

const createTopic = asyncHandler(async (req, res) => {
  const topic = await topicService.createTopic(req.body);
  return ApiResponse.success(res, 201, 'Topic created successfully', topic);
});

const updateTopic = asyncHandler(async (req, res) => {
  const topic = await topicService.updateTopic(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'Topic updated successfully', topic);
});

const getTopicsByClassSubject = asyncHandler(async (req, res) => {
  const { class: studentClass, subject } = req.query;
  const topics = await topicService.getTopicsByClassSubject(studentClass, subject);
  return ApiResponse.success(res, 200, 'Topics fetched successfully', topics);
});

const lookupTopic = asyncHandler(async (req, res) => {
  const topic = await topicService.lookupTopic(req.query);
  return ApiResponse.success(res, 200, 'Topic fetched successfully', topic);
});

const deleteTopic = asyncHandler(async (req, res) => {
  await topicService.deleteTopic(req.params.id);
  return ApiResponse.success(res, 200, 'Topic deleted successfully', null);
});

module.exports = {
  createTopic,
  updateTopic,
  getTopicsByClassSubject,
  lookupTopic,
  deleteTopic
};