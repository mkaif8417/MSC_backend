const teacherDao = require('../daos/teacher.dao');
const ApiError = require('../utils/apiError'); // adjust path if named differently

const createTeacher = async (body) => {
  return teacherDao.create(body);
};

const getTeachers = async (filter, pagination) => {
  const [items, total] = await teacherDao.findAll(filter, pagination);
  const limit = Number(pagination.limit) || 20;
  const page = Number(pagination.page) || 1;
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

const getTeacherById = async (id) => {
  const teacher = await teacherDao.findById(id);
  if (!teacher) throw ApiError.notFound('Teacher not found');
  return teacher;
};

const updateTeacher = async (id, body) => {
  const teacher = await teacherDao.updateById(id, body);
  if (!teacher) throw ApiError.notFound('Teacher not found');
  return teacher;
};

const deactivateTeacher = async (id) => {
  const teacher = await teacherDao.deactivateById(id);
  if (!teacher) throw ApiError.notFound('Teacher not found');
  return teacher;
};

const markAttendance = async (teacherId, body) => {
  await getTeacherById(teacherId); // ensures teacher exists
  return teacherDao.markAttendance({ teacherId, ...body });
};

const getAttendance = async (teacherId, query) => {
  await getTeacherById(teacherId);
  return teacherDao.getAttendance(teacherId, query);
};

const getMonthlyAttendance = async (teacherId, year, month) => {
  await getTeacherById(teacherId);
  return teacherDao.getMonthlyAttendanceSummary(teacherId, year, month);
};

const createDailyReport = async (teacherId, body) => {
  await getTeacherById(teacherId);
  return teacherDao.createDailyReport({ teacherId, ...body });
};

const getDailyReports = async (teacherId, query) => {
  await getTeacherById(teacherId);
  return teacherDao.getDailyReports(teacherId, query);
};

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