const teacherService = require('../services/teacher.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.createTeacher(req.body);
  return ApiResponse.success(res, 201, 'Teacher registered successfully', teacher);
});

const getTeachers = asyncHandler(async (req, res) => {
  const { page, limit, studyCenterId, areaLocalityId, status, search } = req.query;
  const result = await teacherService.getTeachers(
    { studyCenterId, areaLocalityId, status, search },
    { page, limit }
  );
  return ApiResponse.success(res, 200, 'Teachers fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getTeacherById(req.params.id);
  return ApiResponse.success(res, 200, 'Teacher fetched successfully', teacher);
});

const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.updateTeacher(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'Teacher updated successfully', teacher);
});

const deactivateTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.deactivateTeacher(req.params.id);
  return ApiResponse.success(res, 200, 'Teacher deactivated successfully', teacher);
});

const markAttendance = asyncHandler(async (req, res) => {
  const attendance = await teacherService.markAttendance(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'Attendance recorded successfully', attendance);
});

const getAttendance = asyncHandler(async (req, res) => {
  const attendance = await teacherService.getAttendance(req.params.id, req.query);
  return ApiResponse.success(res, 200, 'Attendance fetched successfully', attendance);
});

const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const summary = await teacherService.getMonthlyAttendance(req.params.id, year, month);
  return ApiResponse.success(res, 200, 'Monthly attendance summary fetched successfully', summary);
});

const createDailyReport = asyncHandler(async (req, res) => {
  const report = await teacherService.createDailyReport(req.params.id, req.body);
  return ApiResponse.success(res, 201, 'Daily report submitted successfully', report);
});

const getDailyReports = asyncHandler(async (req, res) => {
  const reports = await teacherService.getDailyReports(req.params.id, req.query);
  return ApiResponse.success(res, 200, 'Daily reports fetched successfully', reports);
});

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deactivateTeacher,
  markAttendance,
  getAttendance,
  getMonthlyAttendance,
  createDailyReport,
  getDailyReports
};