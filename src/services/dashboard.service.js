const dashboardDao = require('../daos/dashboard.dao');
const mosqueService = require('./mosque.service');
const { ROLES } = require('../constants/roles');

// ---------------------------------------------------------
// Global / district-scoped summary (existing, unchanged)
// ---------------------------------------------------------
const resolveScopedAreaIds = async (userContext) => {
  if (!userContext || userContext.role !== ROLES.DISTRICT_ADMIN) {
    return null;
  }

  const allowedDistrictId = userContext.scope && userContext.scope.districtId;
  if (!allowedDistrictId) return [];

  const areaIds = await mosqueService.resolveAreaLocalityIdsForHierarchy({
    districtId: allowedDistrictId
  });

  return (areaIds || []).map((id) => id.toString());
};

const buildSummary = async ({
  mosqueFilter = { isActive: true },
  studyCenterFilter = { isActive: true },
  teacherFilter = {},
  studentFilter = {},
  attendanceFilter = {}
}) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [studyCenters, students, teachers, mosques, todayAttendance] = await Promise.all([
    dashboardDao.countStudyCenters(studyCenterFilter),
    dashboardDao.countStudents(studentFilter),
    dashboardDao.countTeachers(teacherFilter),
    dashboardDao.countMosques(mosqueFilter),
    dashboardDao.getAttendanceForDateRange({
      ...attendanceFilter,
      date: { $gte: todayStart, $lte: todayEnd }
    })
  ]);

  const presentCount = todayAttendance.filter((a) => a.status === 'PRESENT').length;
  const attendancePercent = todayAttendance.length
    ? Math.round((presentCount / todayAttendance.length) * 100)
    : 0;

  return { studyCenters, students, teachers, mosques, attendancePercent };
};

const getDashboardSummary = async (userContext) => {
  const scopedAreaIds = await resolveScopedAreaIds(userContext);

  if (scopedAreaIds === null) {
    return buildSummary({});
  }

  if (scopedAreaIds.length === 0) {
    return { studyCenters: 0, students: 0, teachers: 0, mosques: 0, attendancePercent: 0 };
  }

  const mosqueIds = await dashboardDao.findMosqueIdsByAreaLocalityIds(scopedAreaIds);
  const studyCenterIds = await dashboardDao.findStudyCenterIdsByMosqueIds(mosqueIds);
  const studentIds = await dashboardDao.findStudentIdsByStudyCenterIds(studyCenterIds);

  return buildSummary({
    mosqueFilter: { areaLocalityId: { $in: scopedAreaIds } },
    studyCenterFilter: { mosqueId: { $in: mosqueIds } },
    teacherFilter: { areaLocalityId: { $in: scopedAreaIds } },
    studentFilter: { studyCenterId: { $in: studentIds } },
    attendanceFilter: { studentId: { $in: studentIds } }
  });
};

// ---------------------------------------------------------
// Shared stat-builder for a set of area-locality ids — used for
// both the division-level totals and each district's own totals.
// ---------------------------------------------------------
const buildStatsForAreaLocalityIds = async (areaLocalityIds) => {
  if (!areaLocalityIds.length) {
    return {
      mosques: 0,
      studyCenters: 0,
      teachers: 0,
      students: 0,
      aicuStudents: 0,
      selfStudyStudents: 0,
      specialCourseStudents: 0
    };
  }

  const mosqueIds = await dashboardDao.findMosqueIdsByAreaLocalityIds(areaLocalityIds);
  const studyCenterIds = await dashboardDao.findStudyCenterIdsByMosqueIds(mosqueIds);

  const [
    mosquesCount,
    studyCentersCount,
    teachersCount,
    studentsCount,
    aicuCount,
    selfStudyCount,
    specialCourseCount
  ] = await Promise.all([
    dashboardDao.countMosques({ areaLocalityId: { $in: areaLocalityIds }, isActive: true }),
    dashboardDao.countStudyCenters({ mosqueId: { $in: mosqueIds }, isActive: true }),
    dashboardDao.countTeachers({ areaLocalityId: { $in: areaLocalityIds } }),
    dashboardDao.countStudents({ studyCenterId: { $in: studyCenterIds } }),
    dashboardDao.countStudents({ studyCenterId: { $in: studyCenterIds }, courseType: 'AICU' }),
    dashboardDao.countStudents({ studyCenterId: { $in: studyCenterIds }, courseType: 'Self Study' }),
    dashboardDao.countStudents({ studyCenterId: { $in: studyCenterIds }, courseType: 'Special Course' })
  ]);

  return {
    mosques: mosquesCount,
    studyCenters: studyCentersCount,
    teachers: teachersCount,
    students: studentsCount,
    aicuStudents: aicuCount,
    selfStudyStudents: selfStudyCount,
    specialCourseStudents: specialCourseCount
  };
};

// ---------------------------------------------------------
// Division-wise breakdown, now with a nested per-district breakdown
// ---------------------------------------------------------
const getDivisionWiseSummary = async () => {
  const divisions = await dashboardDao.findAllDivisions();

  const results = await Promise.all(
    divisions.map(async (division) => {
      const districts = await dashboardDao.findDistrictDocsByDivisionId(division._id);

      // Per-district stats — this is the new drill-down data
      const districtStats = await Promise.all(
        districts.map(async (district) => {
          const areaLocalityIds = await dashboardDao.findAreaLocalityIdsByDistrictIds([district._id]);
          const stats = await buildStatsForAreaLocalityIds(areaLocalityIds);

          return {
            districtId: district._id,
            name: district.name,
            code: district.code,
            ...stats
          };
        })
      );

      // Division-level totals (unchanged field names — existing frontend keeps working)
      const districtIds = districts.map((d) => d._id);
      const divisionAreaLocalityIds = await dashboardDao.findAreaLocalityIdsByDistrictIds(districtIds);
      const divisionStats = await buildStatsForAreaLocalityIds(divisionAreaLocalityIds);

      return {
        divisionId: division._id,
        name: division.name,
        code: division.code,
        ...divisionStats,
        districts: districtStats
      };
    })
  );

  return results;
};

module.exports = { getDashboardSummary, getDivisionWiseSummary };