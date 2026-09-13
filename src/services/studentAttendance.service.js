const studentAttendanceDao = require('../daos/studentAttendance.dao');
const studentService = require('./student.service');
const studentDao = require('../daos/student.dao');
const ERROR_CODES = require('../constants/errorCodes');

const validateStudentExists = async (studentId) => {
  const student = await studentDao.findById(studentId);
  if (!student) {
    const error = new Error(`Student with ID ${studentId} does not exist`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }
  return student;
};

// Normalizes an incoming date (string or Date) to midnight UTC,
// so the same calendar day always maps to the same stored value.
const normalizeDate = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

const markAttendance = async (studentId, data, userContext) => {
  const student = await validateStudentExists(studentId);
  await studentService.validateDistrictScopeByStudyCenterId(
    userContext,
    student.studyCenterId
  );

  const date = normalizeDate(data.date);

  const existing = await studentAttendanceDao.findOne(studentId, date);
  if (existing) {
    const error = new Error(
      `Attendance for this student on ${date.toISOString().slice(0, 10)} is already marked`
    );
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  return studentAttendanceDao.create({
    studentId,
    date,
    status: data.status,
    loginTime: data.loginTime || null,
    logoutTime: data.logoutTime || null,
    attendanceType: data.attendanceType || 'REGULAR',
    remarks: data.remarks ? data.remarks.trim() : null,
    markedBy: userContext.userId || userContext._id
  });
};

const updateAttendance = async (attendanceId, updateData, userContext) => {
  const record = await studentAttendanceDao.findById(attendanceId);
  if (!record) {
    const error = new Error('Attendance record not found');
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  const student = await validateStudentExists(record.studentId);
  await studentService.validateDistrictScopeByStudyCenterId(
    userContext,
    student.studyCenterId
  );

  const formattedData = { ...updateData };
  delete formattedData.studentId;
  delete formattedData.date;

  return studentAttendanceDao.updateById(attendanceId, formattedData);
};

const getAttendanceRange = async (studentId, userContext, startDate, endDate) => {
  const student = await validateStudentExists(studentId);
  await studentService.validateDistrictScopeByStudyCenterId(
    userContext,
    student.studyCenterId
  );

  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  return studentAttendanceDao.findByStudentAndDateRange(studentId, start, end);
};

const getMonthlyAttendance = async (studentId, year, month, userContext) => {
  const student = await validateStudentExists(studentId);
  await studentService.validateDistrictScopeByStudyCenterId(
    userContext,
    student.studyCenterId
  );

  return studentAttendanceDao.getMonthlySummary(
    studentId,
    Number(year),
    Number(month)
  );
};

module.exports = {
  markAttendance,
  updateAttendance,
  getAttendanceRange,
  getMonthlyAttendance
};