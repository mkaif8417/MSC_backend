const mongoose = require('mongoose');
const studentDao = require('../daos/student.dao');
const studyCenterDao = require('../daos/studyCenter.dao');
const mosqueDao = require('../daos/mosque.dao');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const Guardian = require('../models/Guardian');
const Counter = require('../models/Counter');
const ERROR_CODES = require('../constants/errorCodes');
const { ROLES } = require('../constants/roles');

/**
 * Traverse StudyCenter -> Mosque -> AreaLocality -> VillageCity -> Taluka -> District
 * and return the populated District document (or null).
 */
const resolveDistrictByStudyCenterId = async (studyCenterId) => {
  const studyCenter = await studyCenterDao.findById(studyCenterId, null, {
    path: 'mosqueId',
    populate: {
      path: 'areaLocalityId',
      populate: {
        path: 'villageCityId',
        populate: { path: 'talukaId', populate: { path: 'districtId' } }
      }
    }
  });

  return (
    (studyCenter &&
      studyCenter.mosqueId &&
      studyCenter.mosqueId.areaLocalityId &&
      studyCenter.mosqueId.areaLocalityId.villageCityId &&
      studyCenter.mosqueId.areaLocalityId.villageCityId.talukaId &&
      studyCenter.mosqueId.areaLocalityId.villageCityId.talukaId.districtId) ||
    null
  );
};

/**
 * Traverse StudyCenter -> Mosque -> AreaLocality -> VillageCity -> Taluka -> District
 * to validate District Admin scope
 */
const validateDistrictScopeByStudyCenterId = async (userContext, studyCenterId) => {
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    const district = await resolveDistrictByStudyCenterId(studyCenterId);
    const districtId = district && district._id;

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
 * Atomically reserve the next GLOBAL sequence number (shared across all
 * districts) and prefix it with this student's own district code.
 * e.g. 1st student ever (Bidar) -> BID001, 2nd (Bengaluru) -> BEN002,
 * 3rd (Bidar again) -> BID003. The number never resets per district.
 */
const getNextRegNo = async (district) => {
  const prefix = (district.name || '')
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();

  const counter = await Counter.findOneAndUpdate(
    { _id: 'studentRegNo' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqPadded = String(counter.seq).padStart(3, '0'); // widens past 999 automatically
  return `${prefix}${seqPadded}`;
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

  const district = await resolveDistrictByStudyCenterId(studyCenterId);
  if (!district) {
    const error = new Error(
      'Unable to determine District for this Study Center — check that AreaLocality → VillageCity → Taluka → District are fully linked'
    );
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    if (!allowedDistrictId || district._id.toString() !== allowedDistrictId.toString()) {
      const error = new Error(
        'Access denied: You are not authorized to manage resources outside your assigned district'
      );
      error.statusCode = 403;
      error.code = ERROR_CODES.FORBIDDEN;
      throw error;
    }
  }

  const regNo = await getNextRegNo(district);

  return studentDao.create({
    regNo,
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

/**
 * Update Student
 *
 * Recomputes the effective `class` (new value if provided, else the existing one)
 * to correctly enforce courseType rules even on partial updates:
 *  - 8th/9th/10th  -> courseType required (AICU or Self Study)
 *  - 11th/12th/Degree -> courseType is not applicable and is forcibly cleared
 */
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

  // regNo is permanent and must never be overwritten via update, regardless
  // of what the client sends in the payload.
  const formattedData = { ...updateData };
  delete formattedData.studyCenterId;
  delete formattedData.regNo;

  ['name', 'fatherGuardianName', 'mobileNumber', 'villageLocality', 'schoolCollegeName', 'currentEducationalLevel'].forEach(
    (field) => {
      if (formattedData[field]) formattedData[field] = formattedData[field].trim();
    }
  );

  const upperGroup = ['11th', '12th', 'Degree'];
  const lowerGroup = ['8th', '9th', '10th'];
  const effectiveClass = formattedData.class || existingStudent.class;

  if (upperGroup.includes(effectiveClass)) {
    // courseType is not applicable for these classes — clear it regardless of
    // what was previously stored or what was sent in this request
    formattedData.courseType = undefined;
  } else if (lowerGroup.includes(effectiveClass)) {
    const effectiveCourseType = formattedData.courseType || existingStudent.courseType;
    if (!effectiveCourseType) {
      const error = new Error('courseType is required for 8th/9th/10th');
      error.statusCode = 400;
      error.code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }
  }

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
  resolveDistrictByStudyCenterId,
  validateDistrictScopeByStudyCenterId,
  getNextRegNo,
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};