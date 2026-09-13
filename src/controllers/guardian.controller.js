const guardianService = require('../services/guardian.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createGuardian = asyncHandler(async (req, res) => {
  const guardian = await guardianService.createGuardian(req.body, req.user);
  return ApiResponse.success(res, 201, 'Guardian record created successfully', guardian);
});

const getGuardianByStudentId = asyncHandler(async (req, res) => {
  const guardian = await guardianService.getGuardianByStudentId(req.params.studentId, req.user);
  return ApiResponse.success(res, 200, 'Guardian record fetched successfully', guardian);
});

const updateGuardian = asyncHandler(async (req, res) => {
  const guardian = await guardianService.updateGuardian(req.params.studentId, req.body, req.user);
  return ApiResponse.success(res, 200, 'Guardian record updated successfully', guardian);
});

module.exports = {
  createGuardian,
  getGuardianByStudentId,
  updateGuardian
};