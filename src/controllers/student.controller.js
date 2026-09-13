const studentService = require('../services/student.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body, req.user);
  return ApiResponse.success(res, 201, 'Student registered successfully', student);
});

const getStudents = asyncHandler(async (req, res) => {
  const { page, limit, studyCenterId, class: studentClass, isActive, search } = req.query;

  const filter = {};
  if (studyCenterId) filter.studyCenterId = studyCenterId;
  if (studentClass) filter.class = studentClass;
  if (search) filter.search = search;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const result = await studentService.getStudents(filter, { page, limit }, req.user);
  return ApiResponse.success(res, 200, 'Students fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Student fetched successfully', student);
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Student updated successfully', student);
});

const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Student deleted successfully', null);
});

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};