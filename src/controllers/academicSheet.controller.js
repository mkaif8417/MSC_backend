const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const academicSheetService = require('../services/academicSheet.service');

const createWeeklySheet = asyncHandler(async (req, res) => {
  const sheet = await academicSheetService.createWeeklySheet(req.body, req.user._id);
  return ApiResponse.success(res, 201, 'Weekly academic sheet created successfully', sheet);
});

const addDailyEntry = asyncHandler(async (req, res) => {
  const sheet = await academicSheetService.addDailyEntry(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'Daily entry saved successfully', sheet);
});

const updateWeeklyResult = asyncHandler(async (req, res) => {
  const sheet = await academicSheetService.updateWeeklyResult(req.params.id, req.body.weeklyResult);
  return ApiResponse.success(res, 200, 'Weekly result updated successfully', sheet);
});

const getSheetById = asyncHandler(async (req, res) => {
  const sheet = await academicSheetService.getSheetById(req.params.id);
  return ApiResponse.success(res, 200, 'Academic sheet fetched successfully', sheet);
});

const getSheetsByStudent = asyncHandler(async (req, res) => {
  const sheets = await academicSheetService.getSheetsByStudent(req.params.studentId);
  return ApiResponse.success(res, 200, 'Academic sheets fetched successfully', sheets);
});

module.exports = {
  createWeeklySheet,
  addDailyEntry,
  updateWeeklyResult,
  getSheetById,
  getSheetsByStudent
};