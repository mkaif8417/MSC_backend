const coordinatorDao = require('../daos/Coordinator.dao');
const ERROR_CODES = require('../constants/errorCodes');

const notFoundError = () => {
  const err = new Error('Coordinator not found');
  err.statusCode = 404;
  err.code = ERROR_CODES.NOT_FOUND;
  return err;
};

const createCoordinator = async (payload) => {
  const existing = await coordinatorDao.findByMobileNumber(payload.mobileNumber);
  if (existing) {
    const err = new Error('A coordinator with this mobile number already exists');
    err.statusCode = 409;
    err.code = ERROR_CODES.DUPLICATE_RESOURCE;
    err.details = [{ field: 'mobileNumber', message: 'mobileNumber must be unique' }];
    throw err;
  }

  return coordinatorDao.create(payload);
};

const getCoordinators = async (filters, { page = 1, limit = 20 } = {}) => {
  const { studyCenterId, areaLocalityId, status, search } = filters;
  const query = {};

  if (studyCenterId) query.studyCenterId = studyCenterId;
  if (areaLocalityId) query.areaLocalityId = areaLocalityId;
  if (status) query.status = status;
  if (search) query.name = { $regex: search, $options: 'i' };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    coordinatorDao.find(query, { skip, limit }),
    coordinatorDao.count(query)
  ]);

  return {
    items,
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit) || 1
  };
};

const getCoordinatorById = async (id) => {
  const coordinator = await coordinatorDao.findById(id);
  if (!coordinator) throw notFoundError();
  return coordinator;
};

const updateCoordinator = async (id, data) => {
  if (data.mobileNumber) {
    const existing = await coordinatorDao.findByMobileNumber(data.mobileNumber);
    if (existing && String(existing._id) !== String(id)) {
      const err = new Error('A coordinator with this mobile number already exists');
      err.statusCode = 409;
      err.code = ERROR_CODES.DUPLICATE_RESOURCE;
      err.details = [{ field: 'mobileNumber', message: 'mobileNumber must be unique' }];
      throw err;
    }
  }

  const coordinator = await coordinatorDao.updateById(id, data);
  if (!coordinator) throw notFoundError();
  return coordinator;
};

const deactivateCoordinator = async (id) => {
  const coordinator = await coordinatorDao.deactivateById(id);
  if (!coordinator) throw notFoundError();
  return coordinator;
};

// Attendance

const markAttendance = async (coordinatorId, data) => {
  await getCoordinatorById(coordinatorId); // ensures coordinator exists
  return coordinatorDao.upsertAttendance(coordinatorId, data);
};

const getAttendance = async (coordinatorId, query) => {
  await getCoordinatorById(coordinatorId);
  return coordinatorDao.findAttendance(coordinatorId, query);
};

const getMonthlyAttendance = async (coordinatorId, year, month) => {
  await getCoordinatorById(coordinatorId);
  const records = await coordinatorDao.findMonthlyAttendance(coordinatorId, year, month);

  const presentCount = records.filter((r) => r.status === 'Present').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;

  return {
    year: Number(year),
    month: Number(month),
    totalMarked: records.length,
    presentCount,
    absentCount,
    records
  };
};

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