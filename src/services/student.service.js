const mongoose = require('mongoose');
const studentDao = require('../daos/student.dao');
const studyCenterDao = require('../daos/studyCenter.dao');
const mosqueDao = require('../daos/mosque.dao');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const Guardian = require('../models/Guardian');
const ERROR_CODES = require('../constants/errorCodes');
const { ROLES } = require('../constants/roles');

/**
 * Traverse StudyCenter -> Mosque -> AreaLocality -> VillageCity -> Taluka -> District
 * to validate District Admin scope
 */
const validateDistrictScopeByStudyCenterId = async (userContext, studyCenterId) => {
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;

    const studyCenter = await studyCenterDao.findById(studyCenterId, null, {
      path: 'mosqueId',
      populate: {
        path: 'areaLocalityId',
        populate: {
          path: 'villageCityId',
          populate: { path: 'talukaId' }
        }
      }
    });

    const districtId =
      studyCenter &&
      studyCenter.mosqueId &&
      studyCenter.mosqueId.areaLocalityId &&
      studyCenter.mosqueId.areaLocalityId.villageCityId &&
      studyCenter.mosqueId.areaLocalityId.villageCityId.talukaId &&
      studyCenter.mosqueId.areaLocalityId.villageCityId.talukaId.districtId;

    if (!districtId || !allowedDistrictId || districtId.toString() !== allowedDistrictId.toString()) {
      const error = new Error(
        'Access denied: You are not authorized to manage resources outside your assigned district'
      );
      error.statusCode = 403;
      error.code = ERROR_CODES.FORBIDDEN;
      throw error;
    }
  }
};

/**
 * Create new Student
 */
const createStudent = async (data, userContext) => {
  const {
    name,
    fatherGuardianName,
    mobileNumber,
    age,
    studyCenterId,
    villageLocality,
    schoolCollegeName,
    currentEducationalLevel,
    class: studentClass,
    courseType,
    isActive
  } = data;

  const parentCenter = await studyCenterDao.findById(studyCenterId);
  if (!parentCenter) {
    const error = new Error(`Parent Study Center with ID ${studyCenterId} does not exist`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  if (!parentCenter.isActive) {
    const error = new Error(
      `Cannot register student under inactive Study Center "${parentCenter.name || parentCenter._id}"`
    );
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  await validateDistrictScopeByStudyCenterId(userContext, studyCenterId);

  return studentDao.create({
    name: name.trim(),
    fatherGuardianName: fatherGuardianName.trim(),
    mobileNumber: mobileNumber ? mobileNumber.trim() : undefined,
    age,
    studyCenterId,
    villageLocality: villageLocality ? villageLocality.trim() : undefined,
    schoolCollegeName: schoolCollegeName ? schoolCollegeName.trim() : undefined,
    currentEducationalLevel: currentEducationalLevel ? currentEducationalLevel.trim() : undefined,
    class: studentClass,
    courseType,
    isActive: isActive !== undefined ? isActive : true
  });
};

/**
 * Get Students with filtering & scope restriction
 */
const getStudents = async (filter = {}, pagination = {}, userContext = null) => {
  const queryFilter = {};

  if (filter.studyCenterId) queryFilter.studyCenterId = filter.studyCenterId;
  if (filter.class) queryFilter.class = filter.class;
  if (filter.isActive !== undefined) queryFilter.isActive = filter.isActive;
  if (filter.search) {
    const searchRegex = new RegExp(filter.search, 'i');
    queryFilter.$or = [{ name: searchRegex }, { fatherGuardianName: searchRegex }];
  }

  // NOTE: Only District Admin scope is enforced today, matching existing codebase pattern.
  // Mosque/StudyCenter-level scoping for MOSQUE_CENTER_ADMIN, TEACHER, DATA_ENTRY_OPERATOR
  // is not yet implemented anywhere in this codebase and should be added before granting
  // those roles write access in production.
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN && filter.studyCenterId) {
    await validateDistrictScopeByStudyCenterId(userContext, filter.studyCenterId);
  }

  return studentDao.paginate(queryFilter, pagination);
};

const getStudentById = async (id, userContext = null) => {
  const student = await studentDao.findById(id);
  if (!student) {
    const error = new Error(`Student not found with ID ${id}`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  await validateDistrictScopeByStudyCenterId(userContext, student.studyCenterId);
  return student;
};

const updateStudent = async (id, updateData, userContext = null) => {
  const existingStudent = await getStudentById(id, userContext);

  if (
    updateData.studyCenterId &&
    updateData.studyCenterId.toString() !== existingStudent.studyCenterId.toString()
  ) {
    const error = new Error('studyCenterId is immutable and cannot be changed after Student creation');
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  const formattedData = { ...updateData };
  delete formattedData.studyCenterId;

  ['name', 'fatherGuardianName', 'mobileNumber', 'villageLocality', 'schoolCollegeName', 'currentEducationalLevel'].forEach(
    (field) => {
      if (formattedData[field]) formattedData[field] = formattedData[field].trim();
    }
  );

  return studentDao.updateById(id, formattedData);
};

/**
 * Permanently delete a Student and cascade-delete their attendance + guardian records.
 */
const deleteStudent = async (id, userContext = null) => {
  await getStudentById(id, userContext); // validates existence + district scope

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await StudentAttendance.deleteMany({ studentId: id }, { session });
    await Guardian.deleteMany({ studentId: id }, { session });
    const deleted = await Student.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return deleted;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = {
  validateDistrictScopeByStudyCenterId,
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};