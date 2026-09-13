const coordinatorService = require('../services/Coordinator.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createCoordinator = asyncHandler(async (req, res) => {
  const coordinator = await coordinatorService.createCoordinator(req.body);
  return ApiResponse.success(res, 201, 'Coordinator registered successfully', coordinator);
});

const getCoordinators = asyncHandler(async (req, res) => {
  const { page, limit, studyCenterId, areaLocalityId, status, search } = req.query;
  const result = await coordinatorService.getCoordinators(
    { studyCenterId, areaLocalityId, status, search },
    { page, limit }
  );
  return ApiResponse.success(res, 200, 'Coordinators fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getCoordinatorById = asyncHandler(async (req, res) => {
  const coordinator = await coordinatorService.getCoordinatorById(req.params.id);
  return ApiResponse.success(res, 200, 'Coordinator fetched successfully', coordinator);
});

const updateCoordinator = asyncHandler(async (req, res) => {
  const coordinator = await coordinatorService.updateCoordinator(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'Coordinator updated successfully', coordinator);
});

const deactivateCoordinator = asyncHandler(async (req, res) => {
  const coordinator = await coordinatorService.deactivateCoordinator(req.params.id);
  return ApiResponse.success(res, 200, 'Coordinator deactivated successfully', coordinator);
});

const markAttendance = asyncHandler(async (req, res) => {
  const attendance = await coordinatorService.markAttendance(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'Attendance recorded successfully', attendance);
});

const getAttendance = asyncHandler(async (req, res) => {
  const attendance = await coordinatorService.getAttendance(req.params.id, req.query);
  return ApiResponse.success(res, 200, 'Attendance fetched successfully', attendance);
});

const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const summary = await coordinatorService.getMonthlyAttendance(req.params.id, year, month);
  return ApiResponse.success(res, 200, 'Monthly attendance summary fetched successfully', summary);
});

module.exports = {
  createCoordinator,
  getCoordinators,
  getCoordinatorById,
  updateCoordinator,
  deactivateCoordinator,
  markAttendance,
  getAttendance,
  getMonthlyAttendance
};