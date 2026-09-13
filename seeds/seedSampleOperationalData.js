/**
 * seeds/seedSampleOperationalData.js
 *
 * Populates one AreaLocality -> Mosque -> StudyCenter -> Teachers/Students/
 * Program/Attendance chain under EACH of the 10 Karnataka divisions.
 *
 * PREREQUISITE: run seedKarnatakaDistrictsTaluka.js and
 * seedKarnatakaDivisions.js first.
 *
 * Idempotent: matched/upserted by unique keys (mosque code, area name+villageCityId,
 * studyCenter mosqueId, student name+studyCenterId), safe to re-run.
 *
 * USAGE: node seeds/seedSampleOperationalData.js
 */
const { ROLES } = require('../src/constants/roles');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Division = require('../src/models/Division');
const District = require('../src/models/District');
const Taluka = require('../src/models/Taluka');
const VillageCity = require('../src/models/VillageCity');
const AreaLocality = require('../src/models/AreaLocality');
const Mosque = require('../src/models/Mosque');
const StudyCenter = require('../src/models/StudyCenter');
const Teacher = require('../src/models/teachers/Teacher');
const Coordinator = require('../src/models/Coordinator');
const Student = require('../src/models/Student');
const Program = require('../src/models/Program');
const StudentAttendance = require('../src/models/StudentAttendance');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) throw new Error('MONGODB_URI is not set. Check your .env');

// ---------------------------------------------------------
// Realistic Islamic name pools
// ---------------------------------------------------------
const MOSQUE_NAMES = [
  'Masjid-e-Noor', 'Masjid-e-Rahmat', 'Masjid-e-Bilal', 'Masjid-e-Umar',
  'Masjid-e-Ayesha', 'Masjid-e-Hidaya', 'Masjid-e-Furqan', 'Masjid-e-Salaam',
  'Masjid-e-Taqwa', 'Masjid-e-Ikhlas'
];

const AREA_NAMES = [
  'Shaheen Nagar', 'Noor Colony', 'Mustafa Nagar', 'Islampura',
  'Hidayath Nagar', 'Rahmania Colony', 'Bilal Nagar', 'Aman Colony',
  'Madina Colony', 'Falah Nagar'
];

const TEACHER_NAMES = [
  { name: 'Mohammed Arif', mobile: '9845012301' },
  { name: 'Abdul Kareem', mobile: '9845012302' },
  { name: 'Mohammed Yaseen', mobile: '9845012303' },
  { name: 'Abdul Rahman', mobile: '9845012304' },
  { name: 'Syed Iqbal', mobile: '9845012305' },
  { name: 'Mohammed Zubair', mobile: '9845012306' },
  { name: 'Abdul Sattar', mobile: '9845012307' },
  { name: 'Mohammed Anas', mobile: '9845012308' },
  { name: 'Syed Tanveer', mobile: '9845012309' },
  { name: 'Mohammed Ilyas', mobile: '9845012310' }
];

const COORDINATOR_NAMES = [
  { name: 'Mohammed Farooq', mobile: '9845022301' },
  { name: 'Abdul Wahab', mobile: '9845022302' },
  { name: 'Syed Nadeem', mobile: '9845022303' },
  { name: 'Mohammed Rafeeq', mobile: '9845022304' },
  { name: 'Abdul Hameed', mobile: '9845022305' },
  { name: 'Mohammed Sohail', mobile: '9845022306' },
  { name: 'Syed Imran', mobile: '9845022307' },
  { name: 'Mohammed Aslam', mobile: '9845022308' },
  { name: 'Abdul Qadir', mobile: '9845022309' },
  { name: 'Mohammed Waseem', mobile: '9845022310' }
];

const STUDENT_POOL = [
  { name: 'Mohammed Arham', father: 'Mohammed Yaseen' },
  { name: 'Abdullah Khan', father: 'Abdul Rahman' },
  { name: 'Mohammed Saad', father: 'Syed Iqbal' },
  { name: 'Mohammed Zeeshan', father: 'Mohammed Zubair' },
  { name: 'Mohammed Rayyan', father: 'Abdul Sattar' },
  { name: 'Mohammed Bilal', father: 'Mohammed Anas' },
  { name: 'Mohammed Uzair', father: 'Syed Tanveer' },
  { name: 'Mohammed Danish', father: 'Mohammed Ilyas' },
  { name: 'Mohammed Sameer', father: 'Mohammed Farooq' },
  { name: 'Mohammed Owais', father: 'Abdul Wahab' },
  { name: 'Mohammed Hamza', father: 'Syed Nadeem' },
  { name: 'Mohammed Talha', father: 'Mohammed Rafeeq' }
];

const CLASS_COURSE_MAP = [
  { class: '8th', courseType: 'AICU' },
  { class: '9th', courseType: 'Self Study' },
  { class: '10th', courseType: 'AICU' },
  { class: '11th', courseType: 'Self Study' },
  { class: '12th', courseType: 'Special Course' },
  { class: 'Degree', courseType: 'Self Study' }
];

const PROGRAM_TOPICS = [
  { name: 'Islamic Manners and Etiquette', topic: 'Respect for Elders' },
  { name: 'Quran Recitation Workshop', topic: 'Tajweed Basics' },
  { name: 'Seerah Study Circle', topic: 'Life of Prophet Muhammad (PBUH)' },
  { name: 'Youth Character Building', topic: 'Honesty and Trustworthiness' }
];

const randomFrom = (arr, idx) => arr[idx % arr.length];
const pad2 = (n) => String(n).padStart(2, '0');

async function findOrCreateTaluka(district, index) {
  let taluka = await Taluka.findOne({ districtId: district._id });
  if (taluka) return taluka;

  taluka = await Taluka.create({
    name: `${district.name} Taluka`,
    code: `${district.code || district.name.slice(0, 3).toUpperCase()}T`,
    districtId: district._id,
    isActive: true
  });
  return taluka;
}

async function findOrCreateVillageCity(taluka) {
  let village = await VillageCity.findOne({ talukaId: taluka._id });
  if (village) return village;

  village = await VillageCity.create({
    villageCityName: `${taluka.name.replace(' Taluka', '')} City`,
    code: `${taluka.code}C`,
    talukaId: taluka._id,
    type: 'CITY',
    isActive: true
  });
  return village;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');


// ...
const adminUser = await User.findOne({ role: ROLES.SUPER_ADMIN });
  if (!adminUser) throw new Error('No super_admin user found. Run seedMasterData.js first.');

  const divisions = await Division.find({ isActive: true });
  if (!divisions.length) throw new Error('No divisions found. Run seedKarnatakaDivisions.js first.');

  let created = { areas: 0, mosques: 0, studyCenters: 0, teachers: 0, coordinators: 0, students: 0, programs: 0, attendance: 0 };

  for (let i = 0; i < divisions.length; i++) {
    const division = divisions[i];

    const district = await District.findOne({ divisionId: division._id });
    if (!district) {
      console.warn(`⚠ No district linked to ${division.name}. Skipping.`);
      continue;
    }

    const taluka = await findOrCreateTaluka(district, i);
    const village = await findOrCreateVillageCity(taluka);

    // ---- AreaLocality ----
    const areaName = randomFrom(AREA_NAMES, i);
    const areaCode = `${(district.code || district.name.slice(0, 2)).toUpperCase()}${pad2(i + 1)}`;
    const areaLocality = await AreaLocality.findOneAndUpdate(
      { villageCityId: village._id, name: areaName },
      { $setOnInsert: { code: areaCode, pincode: `5${pad2(80 + i)}401`, isActive: true } },
      { upsert: true, new: true }
    );
    created.areas++;

    // ---- Mosque ----
    const mosqueName = randomFrom(MOSQUE_NAMES, i);
    const mosqueCode = `${areaCode}-MSQ`;
const mosque = await Mosque.findOneAndUpdate(
  { areaLocalityId: areaLocality._id, name: mosqueName },
  {
    $setOnInsert: {
      code: mosqueCode,
      address: `Sy No ${10 + i}/1, near ${areaName}, ${village.villageCityName}`,
      pincode: areaLocality.pincode,
      capacity: 200 + i * 10,
      inchargeName: randomFrom(COORDINATOR_NAMES, i).name,
      contactNumber: randomFrom(TEACHER_NAMES, i).mobile,
      isActive: true
    }
  },
  { upsert: true, new: true, setDefaultsOnInsert: false }
);
    created.mosques++;

    // ---- StudyCenter (1-to-1 with Mosque) ----
    const studyCenter = await StudyCenter.findOneAndUpdate(
      { mosqueId: mosque._id },
      {
        $setOnInsert: {
          name: `${mosqueName.replace('Masjid-e-', '')} Study Center`,
          startDate: new Date('2026-06-01'),
          tablesCount: 10 + i,
          chairsCount: 20 + i * 2,
          capacity: 30 + i * 2,
          roomsCount: 2,
          inchargeName: randomFrom(COORDINATOR_NAMES, i + 1).name,
          contactNumber: randomFrom(TEACHER_NAMES, i + 1).mobile,
          grade: ['A', 'A++', 'B', 'B+', 'B++'][i % 5],
          isActive: true
        }
      },
      { upsert: true, new: true }
    );
    created.studyCenters++;

    // ---- Teachers (2 per study center) ----
    const teacherIds = [];
    for (let t = 0; t < 2; t++) {
      const teacherData = randomFrom(TEACHER_NAMES, i * 2 + t);
      const teacher = await Teacher.findOneAndUpdate(
        { mobileNumber: `98450${pad2(30 + i)}${t}${t}` },
        {
          $setOnInsert: {
            name: teacherData.name,
            mobileNumber: `98450${pad2(30 + i)}${t}${t}`,
            qualification: t === 0 ? 'Aalim, B.Ed' : 'Hafiz-e-Quran',
            subjects: t === 0 ? ['Quran', 'Islamic Studies'] : ['Arabic', 'Fiqh'],
            areaLocalityId: areaLocality._id,
            studyCenterId: studyCenter._id,
            joiningDate: new Date('2026-06-15'),
            status: 'Active'
          }
        },
        { upsert: true, new: true }
      );
      teacherIds.push(teacher._id);
      created.teachers++;
    }

    // ---- Coordinator (1 per study center) ----
    const coordinatorData = randomFrom(COORDINATOR_NAMES, i);
    await Coordinator.findOneAndUpdate(
      { mobileNumber: `98450${pad2(40 + i)}00` },
      {
        $setOnInsert: {
          name: coordinatorData.name,
          mobileNumber: `98450${pad2(40 + i)}00`,
          qualification: 'B.A, Islamic Studies',
          subjects: ['Coordination', 'Community Outreach'],
          areaLocalityId: areaLocality._id,
          studyCenterId: studyCenter._id,
          joiningDate: new Date('2026-06-10'),
          status: 'Active'
        }
      },
      { upsert: true, new: true }
    );
    created.coordinators++;

    // ---- Students (4 per study center, spread across classes/courseTypes) ----
    const studentIds = [];
    for (let s = 0; s < 4; s++) {
      const studentInfo = randomFrom(STUDENT_POOL, i * 4 + s);
      const classCourse = randomFrom(CLASS_COURSE_MAP, i * 4 + s);

      const student = await Student.findOneAndUpdate(
        { studyCenterId: studyCenter._id, name: studentInfo.name },
        {
          $setOnInsert: {
            fatherGuardianName: studentInfo.father,
            mobileNumber: `97${pad2(30 + i)}${pad2(10 + s)}00`,
            age: 13 + (i + s) % 10,
            studyCenterId: studyCenter._id,
            villageLocality: areaName,
            schoolCollegeName: `${village.villageCityName} Govt School`,
            currentEducationalLevel: classCourse.class,
            class: classCourse.class,
            courseType: classCourse.courseType,
            isActive: true
          }
        },
        { upsert: true, new: true }
      );
      studentIds.push(student._id);
      created.students++;
    }

    // ---- Program (1 per study center) ----
    const programInfo = randomFrom(PROGRAM_TOPICS, i);
    await Program.findOneAndUpdate(
      { studyCenter: studyCenter._id, programName: programInfo.name },
      {
        $setOnInsert: {
          topic: programInfo.topic,
          frequency: ['Weekly', 'Monthly', 'Quarterly'][i % 3],
          studentAttendance: ['A', 'B', 'C'][i % 3],
          committeeInvolvement: ['A', 'B', 'C'][(i + 1) % 3],
          rewards: 'Certificate of Excellence',
          isActive: true
        }
      },
      { upsert: true, new: true }
    );
    created.programs++;

    // ---- Today's attendance for each student ----
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let s = 0; s < studentIds.length; s++) {
      await StudentAttendance.findOneAndUpdate(
        { studentId: studentIds[s], date: today },
        {
          $setOnInsert: {
            status: s % 4 === 3 ? 'ABSENT' : 'PRESENT', // 1 in 4 absent
            loginTime: s % 4 === 3 ? null : '09:00 AM',
            logoutTime: s % 4 === 3 ? null : '12:00 PM',
            attendanceType: 'REGULAR',
            markedBy: adminUser._id
          }
        },
        { upsert: true, new: true }
      );
      created.attendance++;
    }

    console.log(`✔ ${division.name}: area, mosque, study center, 2 teachers, 1 coordinator, 4 students, 1 program seeded.`);
  }

  console.log('\nSummary:', created);
  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});