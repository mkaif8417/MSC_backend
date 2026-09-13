const CoordinatorAttendance = require('../models/CoordinatorAttendance');
const Coordinator = require('../models/Coordinator');

const create = (data) => Coordinator.create(data);

const findByMobileNumber = (mobileNumber) => Coordinator.findOne({ mobileNumber });

const findById = (id) => Coordinator.findById(id);

const find = (filter, { skip = 0, limit = 20 } = {}) =>
  Coordinator.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('areaLocalityId', 'name')
    .populate('studyCenterId', 'name');

const count = (filter) => Coordinator.countDocuments(filter);

const updateById = (id, data) =>
  Coordinator.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deactivateById = (id) =>
  Coordinator.findByIdAndUpdate(id, { status: 'Inactive' }, { new: true });

// Attendance

const upsertAttendance = (coordinatorId, data) =>
  CoordinatorAttendance.findOneAndUpdate(
    { coordinatorId, date: data.date },
    { ...data, coordinatorId },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

const findAttendance = (coordinatorId, { from, to } = {}) => {
  const filter = { coordinatorId };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  return CoordinatorAttendance.find(filter).sort({ date: -1 });
};

const findMonthlyAttendance = (coordinatorId, year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return CoordinatorAttendance.find({
    coordinatorId,
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });
};

module.exports = {
  create,
  findByMobileNumber,
  findById,
  find,
  count,
  updateById,
  deactivateById,
  upsertAttendance,
  findAttendance,
  findMonthlyAttendance
};