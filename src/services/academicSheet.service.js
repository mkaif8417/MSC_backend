const academicSheetDao = require('../daos/academicSheet.dao');
const studentDao = require('../daos/student.dao');
const topicDao = require('../daos/topic.dao');
const ApiError = require('../utils/apiError');
const { SUBJECTS } = require('../models/AcademicSheet');

// Resolves TP for every subject entry from the Topic master collection.
// Teachers never type the topic — it's stamped on here.
const attachTopics = async (studentClass, subjects) => {
  return Promise.all(
    subjects.map(async (entry) => {
      if (!entry.pageNumber) {
        return { ...entry, topic: null };
      }
      const topicDoc = await topicDao.findOneLookup({
        subject: entry.subject,
        class: studentClass,
        pageNumber: entry.pageNumber
      });
      return { ...entry, topic: topicDoc ? topicDoc.topic : null };
    })
  );
};

const assertAicuEligible = (student) => {
  const eligibleClasses = ['8th', '9th', '10th'];
  if (!eligibleClasses.includes(student.class)) {
    throw ApiError.badRequest('Academic sheets apply only to 8th, 9th and 10th class students');
  }
  if (student.courseType !== 'AICU') {
    throw ApiError.badRequest('This student is not enrolled in AICU — academic sheet does not apply');
  }
};

const createWeeklySheet = async (payload, teacherId) => {
  const student = await studentDao.findById(payload.studentId);
  if (!student) throw ApiError.notFound('Student not found');
  assertAicuEligible(student);

  const existing = await academicSheetDao.findByStudentAndWeek(payload.studentId, payload.weekStartDate);
  if (existing) {
    throw ApiError.conflict('An academic sheet for this student and week already exists');
  }

  return academicSheetDao.create({
    ...payload,
    class: student.class,
    studyCenterId: student.studyCenterId,
    filledBy: teacherId
  });
};

const addDailyEntry = async (sheetId, dailyEntry) => {
  const sheet = await academicSheetDao.findById(sheetId);
  if (!sheet) throw ApiError.notFound('Academic sheet not found');

  const subjectsWithTopics = await attachTopics(sheet.class, dailyEntry.subjects || []);

  sheet.dailyEntries.push({ ...dailyEntry, subjects: subjectsWithTopics });
  await sheet.save();
  return sheet;
};

const updateWeeklyResult = async (sheetId, weeklyResult) => {
  const sheet = await academicSheetDao.findById(sheetId);
  if (!sheet) throw ApiError.notFound('Academic sheet not found');

  weeklyResult.forEach((row) => {
    const target = sheet.weeklyResult.find((r) => r.subject === row.subject);
    if (target) {
      target.totalMarks = row.totalMarks;
      target.obtainedMarks = row.obtainedMarks;
    }
  });

  await sheet.save(); // pre('validate') recomputes % and grade
  return sheet;
};

const getSheetById = async (sheetId) => {
  const sheet = await academicSheetDao.findById(sheetId);
  if (!sheet) throw ApiError.notFound('Academic sheet not found');
  return sheet;
};

const getSheetsByStudent = async (studentId) => {
  return academicSheetDao.findByStudentId(studentId);
};

module.exports = {
  createWeeklySheet,
  addDailyEntry,
  updateWeeklyResult,
  getSheetById,
  getSheetsByStudent,
  SUBJECTS
};