const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.user);
  return ApiResponse.success(res, 200, 'Dashboard summary fetched successfully', summary);
});

const getDivisionWiseSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDivisionWiseSummary();
  return ApiResponse.success(res, 200, 'Division-wise summary fetched successfully', summary);
});

module.exports = { getDashboardSummary, getDivisionWiseSummary };