const guardianDao = require('../daos/guardian.dao');
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

const createGuardian = async (data, userContext) => {
  const { studentId, guardianName, relationToStudent, mobileNumber, alternateMobileNumber, address } = data;

  const student = await validateStudentExists(studentId);
  await studentService.validateDistrictScopeByStudyCenterId(userContext, student.studyCenterId);

  const existingGuardian = await guardianDao.findByStudentId(studentId);
  if (existingGuardian) {
    const error = new Error(`Student already has an associated Guardian record`);
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  try {
    return await guardianDao.create({
      studentId,
      guardianName: guardianName.trim(),
      relationToStudent: relationToStudent ? relationToStudent.trim() : undefined,
      mobileNumber: mobileNumber ? mobileNumber.trim() : undefined,
      alternateMobileNumber: alternateMobileNumber ? alternateMobileNumber.trim() : undefined,
      address: address ? address.trim() : undefined
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.studentId) {
      const error = new Error(`Student already has an associated Guardian record`);
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
    throw err;
  }
};

const getGuardianByStudentId = async (studentId, userContext = null) => {
  const student = await validateStudentExists(studentId);
  await studentService.validateDistrictScopeByStudyCenterId(userContext, student.studyCenterId);

  const guardian = await guardianDao.findByStudentId(studentId);
  if (!guardian) {
    const error = new Error(`Guardian record not found for Student ID ${studentId}`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }
  return guardian;
};

const updateGuardian = async (studentId, updateData, userContext = null) => {
  const existingGuardian = await getGuardianByStudentId(studentId, userContext);

  const formattedData = { ...updateData };
  delete formattedData.studentId;

  ['guardianName', 'relationToStudent', 'mobileNumber', 'alternateMobileNumber', 'address'].forEach((field) => {
    if (formattedData[field]) formattedData[field] = formattedData[field].trim();
  });

  return guardianDao.updateById(existingGuardian._id, formattedData);
};

module.exports = {
  createGuardian,
  getGuardianByStudentId,
  updateGuardian
};