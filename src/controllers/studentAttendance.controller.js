const studentAttendanceService = require('../services/studentAttendance.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const markAttendance = asyncHandler(async (req, res) => {
  const record = await studentAttendanceService.markAttendance(
    req.params.studentId,
    req.body,
    req.user
  );
  return ApiResponse.success(res, 201, 'Attendance marked successfully', record);
});

const updateAttendance = asyncHandler(async (req, res) => {
  const record = await studentAttendanceService.updateAttendance(
    req.params.attendanceId,
    req.body,
    req.user
  );
  return ApiResponse.success(res, 200, 'Attendance updated successfully', record);
});

const getAttendanceRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const records = await studentAttendanceService.getAttendanceRange(
    req.params.studentId,
    req.user,
    startDate,
    endDate
  );
  return ApiResponse.success(res, 200, 'Attendance records fetched successfully', records);
});

const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const summary = await studentAttendanceService.getMonthlyAttendance(
    req.params.studentId,
    year,
    month,
    req.user
  );
  return ApiResponse.success(res, 200, 'Monthly attendance fetched successfully', summary);
});

module.exports = {
  markAttendance,
  updateAttendance,
  getAttendanceRange,
  getMonthlyAttendance
};