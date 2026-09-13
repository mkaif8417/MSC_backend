const Student = require('../models/Student');
const StudyCenter = require('../models/StudyCenter');
const Mosque = require('../models/Mosque');
const Teacher = require('../models/teachers/Teacher');
const StudentAttendance = require('../models/StudentAttendance');
const Division = require('../models/Division');
const District = require('../models/District');
const Taluka = require('../models/Taluka');
const VillageCity = require('../models/VillageCity');
const AreaLocality = require('../models/AreaLocality');

// ---------------------------------------------------------
// Basic counts
// ---------------------------------------------------------
const countStudyCenters = async (filter = {}) => StudyCenter.countDocuments(filter);
const countMosques = async (filter = {}) => Mosque.countDocuments(filter);
const countTeachers = async (filter = {}) => Teacher.countDocuments(filter);
const countStudents = async (filter = {}) => Student.countDocuments(filter);

// ---------------------------------------------------------
// Hierarchy traversal helpers
// ---------------------------------------------------------
const findStudyCenterIdsByMosqueIds = async (mosqueIds) => {
  const centers = await StudyCenter.find({ mosqueId: { $in: mosqueIds } }).select('_id').lean();
  return centers.map((c) => c._id);
};

const findMosqueIdsByAreaLocalityIds = async (areaLocalityIds) => {
  const mosques = await Mosque.find({ areaLocalityId: { $in: areaLocalityIds } }).select('_id').lean();
  return mosques.map((m) => m._id);
};

const findStudentIdsByStudyCenterIds = async (studyCenterIds) => {
  const students = await Student.find({ studyCenterId: { $in: studyCenterIds } }).select('_id').lean();
  return students.map((s) => s._id);
};

const getAttendanceForDateRange = async (filter = {}) => {
  return StudentAttendance.find(filter).select('status').lean();
};

// ---------------------------------------------------------
// Division-wise helpers
// ---------------------------------------------------------
const findAllDivisions = async () => Division.find({ isActive: true }).select('name code').lean();

const findDistrictIdsByDivisionId = async (divisionId) => {
  const districts = await District.find({ divisionId }).select('_id').lean();
  return districts.map((d) => d._id);
};

// NEW: full district docs (name + code), used to build the per-district
// breakdown shown when a division row is expanded on the dashboard.
const findDistrictDocsByDivisionId = async (divisionId) => {
  return District.find({ divisionId, isActive: true }).select('name code').lean();
};

const findAreaLocalityIdsByDistrictIds = async (districtIds) => {
  if (!districtIds.length) return [];

  const talukas = await Taluka.find({ districtId: { $in: districtIds } }).select('_id').lean();
  const talukaIds = talukas.map((t) => t._id);

  if (!talukaIds.length) return [];

  const villages = await VillageCity.find({ talukaId: { $in: talukaIds } }).select('_id').lean();
  const villageIds = villages.map((v) => v._id);

  if (!villageIds.length) return [];

  const areas = await AreaLocality.find({ villageCityId: { $in: villageIds } }).select('_id').lean();
  return areas.map((a) => a._id);
};

module.exports = {
  countStudyCenters,
  countMosques,
  countTeachers,
  countStudents,
  findStudyCenterIdsByMosqueIds,
  findMosqueIdsByAreaLocalityIds,
  findStudentIdsByStudyCenterIds,
  getAttendanceForDateRange,
  findAllDivisions,
  findDistrictIdsByDivisionId,
  findDistrictDocsByDivisionId,
  findAreaLocalityIdsByDistrictIds
};