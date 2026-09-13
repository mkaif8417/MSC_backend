const createBaseDao = require('./base.dao');
const StudentAttendance = require('../models/StudentAttendance');

const baseDao = createBaseDao(StudentAttendance);

const findOne = async (studentId, date) => {
  return StudentAttendance.findOne({ studentId, date });
};

const findByStudentAndDateRange = async (studentId, startDate, endDate) => {
  return StudentAttendance.find({
    studentId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

// Aggregates one student's attendance for a given month into the
// summary shape Module 12.3 asks for.
const getMonthlySummary = async (studentId, year, month) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const records = await StudentAttendance.find({
    studentId,
    date: { $gte: startDate, $lte: endDate }
  });

  const totalWorkingDays = new Set(
    records.map((r) => r.date.toISOString().slice(0, 10))
  ).size;

  const presentRecords = records.filter((r) => r.status === 'PRESENT');
  const daysPresent = new Set(
    presentRecords.map((r) => r.date.toISOString().slice(0, 10))
  ).size;

  const daysAbsent = totalWorkingDays - daysPresent;
  const attendancePercentage =
    totalWorkingDays > 0
      ? Number(((daysPresent / totalWorkingDays) * 100).toFixed(2))
      : 0;

  const irregularCount = records.filter(
    (r) => r.attendanceType === 'IRREGULAR'
  ).length;

  return {
    studentId,
    year,
    month,
    totalWorkingDays,
    daysPresent,
    daysAbsent,
    attendancePercentage,
    regularIrregularStatus: irregularCount > 0 ? 'IRREGULAR' : 'REGULAR',
    records
  };
};

module.exports = {
  ...baseDao,
  findOne,
  findByStudentAndDateRange,
  getMonthlySummary
};