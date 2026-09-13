const Teacher = require('../models/teachers/Teacher');
const TeacherAttendance = require('../models/teachers/TeacherAttendance');
const TeacherDailyReport = require('../models/teachers/TeacherDailyReport');

const create = (data) => Teacher.create(data);

const findById = (id) => Teacher.findById(id);

const findAll = (filter, { page = 1, limit = 20 } = {}) => {
  const query = {};
  if (filter.studyCenterId) query.studyCenterId = filter.studyCenterId;
  if (filter.areaLocalityId) query.areaLocalityId = filter.areaLocalityId;
  if (filter.status) query.status = filter.status;
  if (filter.search) query.name = { $regex: filter.search, $options: 'i' };

  const skip = (page - 1) * limit;
  return Promise.all([
    Teacher.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Teacher.countDocuments(query)
  ]);
};

const updateById = (id, data) =>
  Teacher.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deactivateById = (id) =>
  Teacher.findByIdAndUpdate(id, { status: 'Inactive' }, { new: true });

// Attendance
const markAttendance = (data) =>
  TeacherAttendance.findOneAndUpdate(
    { teacherId: data.teacherId, date: data.date },
    data,
    { upsert: true, new: true, runValidators: true }
  );

const getAttendance = (teacherId, { from, to } = {}) => {
  const query = { teacherId };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  return TeacherAttendance.find(query).sort({ date: -1 });
};

const getMonthlyAttendanceSummary = async (teacherId, year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const records = await TeacherAttendance.find({
    teacherId,
    date: { $gte: start, $lte: end }
  });

  const totalWorkingDays = records.length;
  const daysPresent = records.filter((r) => r.status === 'Present').length;
  const daysAbsent = totalWorkingDays - daysPresent;
  const attendancePercentage = totalWorkingDays
    ? Number(((daysPresent / totalWorkingDays) * 100).toFixed(2))
    : 0;

  return { totalWorkingDays, daysPresent, daysAbsent, attendancePercentage };
};

// Daily Reports
const createDailyReport = (data) => TeacherDailyReport.create(data);

const getDailyReports = (teacherId, { from, to } = {}) => {
  const query = { teacherId };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  return TeacherDailyReport.find(query).sort({ date: -1 });
};

module.exports = {
  create,
  findById,
  findAll,
  updateById,
  deactivateById,
  markAttendance,
  getAttendance,
  getMonthlyAttendanceSummary,
  createDailyReport,
  getDailyReports
};