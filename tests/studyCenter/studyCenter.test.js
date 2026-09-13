const request = require('supertest');
const app = require('../../src/app');
const stateDao = require('../../src/daos/state.dao');
const districtDao = require('../../src/daos/district.dao');
const talukaDao = require('../../src/daos/taluka.dao');
const villageCityDao = require('../../src/daos/villageCity.dao');
const areaLocalityDao = require('../../src/daos/areaLocality.dao');
const mosqueDao = require('../../src/daos/mosque.dao');
const studyCenterDao = require('../../src/daos/studyCenter.dao');
const userDao = require('../../src/daos/user.dao');
const StudyCenter = require('../../src/models/StudyCenter');
const { ROLES } = require('../../src/constants/roles');
const { signToken } = require('../../src/utils/jwt');
const env = require('../../src/config/env');
const { setupTestDB, clearTestDB, teardownTestDB } = require('../setup');

describe('Phase 4 — Study Center Management API Tests', () => {
  let superAdminCookie, districtAdmin1Cookie, districtAdmin2Cookie, teacherCookie;
  let state1, district1, district2, taluka1, taluka2, villageCity1, villageCity2;
  let areaLocality1, areaLocality2;
  let mosqueDistrict1, mosqueDistrict2, inactiveMosque;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // 1. Setup Location Hierarchy for District 1
    state1 = await stateDao.create({ name: 'Karnataka', code: 'KA', isActive: true });

    district1 = await districtDao.create({
      name: 'Bengaluru Urban',
      code: 'BLR',
      stateId: state1._id,
      isActive: true
    });

    taluka1 = await talukaDao.create({
      name: 'Bengaluru South',
      code: 'BS',
      districtId: district1._id,
      isActive: true
    });

    villageCity1 = await villageCityDao.create({
      name: 'Jayanagar',
      code: 'JYN',
      talukaId: taluka1._id,
      type: 'CITY',
      isActive: true
    });

    areaLocality1 = await areaLocalityDao.create({
      name: '4th Block',
      code: 'B4',
      villageCityId: villageCity1._id,
      pincode: '560041',
      isActive: true
    });

    mosqueDistrict1 = await mosqueDao.create({
      name: 'Jamia Masjid 4th Block',
      address: 'Main Rd',
      pincode: '560041',
      areaLocalityId: areaLocality1._id,
      isActive: true
    });

    inactiveMosque = await mosqueDao.create({
      name: 'Inactive Mosque',
      address: 'Old St',
      pincode: '560041',
      areaLocalityId: areaLocality1._id,
      isActive: false
    });

    // 2. Setup Location Hierarchy for District 2
    district2 = await districtDao.create({
      name: 'Mysuru',
      code: 'MYS',
      stateId: state1._id,
      isActive: true
    });

    taluka2 = await talukaDao.create({
      name: 'Mysuru North',
      code: 'MN',
      districtId: district2._id,
      isActive: true
    });

    villageCity2 = await villageCityDao.create({
      name: 'Gokulam',
      code: 'GOK',
      talukaId: taluka2._id,
      type: 'CITY',
      isActive: true
    });

    areaLocality2 = await areaLocalityDao.create({
      name: 'VV Mohalla',
      code: 'VVM',
      villageCityId: villageCity2._id,
      pincode: '570002',
      isActive: true
    });

    mosqueDistrict2 = await mosqueDao.create({
      name: 'Royal Mosque VV Mohalla',
      address: 'VV Mohalla Rd',
      pincode: '570002',
      areaLocalityId: areaLocality2._id,
      isActive: true
    });

    // 3. Setup Users & Sessions
    const superAdmin = await userDao.createUser({
      name: 'Super Admin',
      email: 'superadmin@masjidcenter.org',
      passwordHash: 'Pass@123',
      role: ROLES.SUPER_ADMIN,
      scope: { type: 'GLOBAL' },
      isActive: true
    });

    const districtAdmin1 = await userDao.createUser({
      name: 'District Admin 1',
      email: 'districtadmin1@masjidcenter.org',
      passwordHash: 'Pass@123',
      role: ROLES.DISTRICT_ADMIN,
      scope: { type: 'DISTRICT', districtId: district1._id },
      isActive: true
    });

    const districtAdmin2 = await userDao.createUser({
      name: 'District Admin 2',
      email: 'districtadmin2@masjidcenter.org',
      passwordHash: 'Pass@123',
      role: ROLES.DISTRICT_ADMIN,
      scope: { type: 'DISTRICT', districtId: district2._id },
      isActive: true
    });

    const teacher = await userDao.createUser({
      name: 'Teacher User',
      email: 'teacher@masjidcenter.org',
      passwordHash: 'Pass@123',
      role: ROLES.TEACHER,
      scope: { type: 'CENTER' },
      isActive: true
    });

    superAdminCookie = [`${env.AUTH_COOKIE_NAME}=${signToken({ id: superAdmin._id.toString(), role: superAdmin.role })}`];
    districtAdmin1Cookie = [`${env.AUTH_COOKIE_NAME}=${signToken({ id: districtAdmin1._id.toString(), role: districtAdmin1.role })}`];
    districtAdmin2Cookie = [`${env.AUTH_COOKIE_NAME}=${signToken({ id: districtAdmin2._id.toString(), role: districtAdmin2.role })}`];
    teacherCookie = [`${env.AUTH_COOKIE_NAME}=${signToken({ id: teacher._id.toString(), role: teacher.role })}`];

    await StudyCenter.init();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // ========================================================
  // 1. STUDY CENTER CREATION & 1-TO-1 CONSTRAINT TESTS
  // ========================================================
  describe('Study Center Creation & 1-to-1 Mosque Constraint', () => {
    it('should allow Super Admin to create a Study Center under an active Mosque', async () => {
      const res = await request(app)
        .post('/api/v1/study-centers')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Jamia Study Center',
          mosqueId: mosqueDistrict1._id.toString(),
          capacity: 40,
          tablesCount: 10,
          chairsCount: 40,
          roomsCount: 2,
          inchargeName: 'Shaikh Usama',
          contactNumber: '+919988776655',
          facilities: {
            electricity: { available: true, condition: 'Good' },
            internetWifi: { available: true, condition: 'Good' }
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mosqueId.toString()).toBe(mosqueDistrict1._id.toString());
      expect(res.body.data.capacity).toBe(40);
    });

    it('should reject creation if mosqueId is missing or invalid', async () => {
      const res = await request(app)
        .post('/api/v1/study-centers')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Invalid Mosque Center',
          mosqueId: 'invalid-hex-id'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation for a non-existent Mosque ID (404)', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/v1/study-centers')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Center Nonexistent Mosque',
          mosqueId: fakeId
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation under an inactive Mosque (400)', async () => {
      const res = await request(app)
        .post('/api/v1/study-centers')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Center Inactive Mosque',
          mosqueId: inactiveMosque._id.toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/inactive/i);
    });

    it('should reject creation of a 2nd Study Center for the SAME Mosque (409 Conflict)', async () => {
      await studyCenterDao.create({
        name: 'First Center',
        mosqueId: mosqueDistrict1._id,
        capacity: 30
      });

      const res = await request(app)
        .post('/api/v1/study-centers')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Second Center Attempt',
          mosqueId: mosqueDistrict1._id.toString(),
          capacity: 50
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already has an associated Study Center/i);
    });

    it('should allow creation of Study Centers for DIFFERENT Mosques', async () => {
      await studyCenterDao.create({
        name: 'Center Mosque 1',
        mosqueId: mosqueDistrict1._id
      });

      const res = await request(app)
        .post('/api/v1/study-centers')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Center Mosque 2',
          mosqueId: mosqueDistrict2._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should enforce 1-to-1 constraint at MongoDB unique index level (Direct Mongoose Error Test)', async () => {
      await StudyCenter.create({
        name: 'Direct Center 1',
        mosqueId: mosqueDistrict1._id
      });

      let dbError = null;
      try {
        await StudyCenter.create({
          name: 'Direct Center 2 Duplicate',
          mosqueId: mosqueDistrict1._id
        });
      } catch (err) {
        dbError = err;
      }

      expect(dbError).toBeDefined();
      expect(dbError.code).toBe(11000); // E11000 duplicate key error code
    });
  });

  // ========================================================
  // 2. READ / SEARCH / FILTERING TESTS
  // ========================================================
  describe('Study Center Retrieval & Filtering (GET /api/v1/study-centers)', () => {
    let center1, center2;

    beforeEach(async () => {
      center1 = await studyCenterDao.create({
        name: 'Center Urban Jayanagar',
        mosqueId: mosqueDistrict1._id,
        capacity: 30,
        inchargeName: 'Zaid',
        isActive: true
      });

      center2 = await studyCenterDao.create({
        name: 'Center Royal VV Mohalla',
        mosqueId: mosqueDistrict2._id,
        capacity: 50,
        inchargeName: 'Bilal',
        isActive: false
      });
    });

    it('should allow Super Admin to list all Study Centers with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/study-centers')
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter Study Centers by mosqueId', async () => {
      const res = await request(app)
        .get(`/api/v1/study-centers?mosqueId=${mosqueDistrict1._id.toString()}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(center1._id.toString());
    });

    it('should filter Study Centers by districtId cascading filter', async () => {
      const res = await request(app)
        .get(`/api/v1/study-centers?districtId=${district2._id.toString()}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(center2._id.toString());
    });

    it('should search Study Centers by keyword in name or inchargeName', async () => {
      const res = await request(app)
        .get('/api/v1/study-centers?search=Bilal')
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].inchargeName).toBe('Bilal');
    });

    it('should fetch Study Center by ID with populated mosqueId', async () => {
      const res = await request(app)
        .get(`/api/v1/study-centers/${center1._id.toString()}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(center1._id.toString());
      expect(res.body.data.mosqueId.name).toBe('Jamia Masjid 4th Block');
    });
  });

  // ========================================================
  // 3. UPDATE & IMMUTABILITY TESTS
  // ========================================================
  describe('Study Center Update & mosqueId Immutability', () => {
    let center1;

    beforeEach(async () => {
      center1 = await studyCenterDao.create({
        name: 'Initial Center Name',
        mosqueId: mosqueDistrict1._id,
        capacity: 25,
        isActive: true
      });
    });

    it('should update allowed Study Center fields', async () => {
      const res = await request(app)
        .patch(`/api/v1/study-centers/${center1._id.toString()}`)
        .set('Cookie', superAdminCookie)
        .send({
          capacity: 45,
          inchargeName: 'New Manager',
          grade: 'A'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.capacity).toBe(45);
      expect(res.body.data.inchargeName).toBe('New Manager');
      expect(res.body.data.grade).toBe('A');
    });

    it('should REJECT attempts to mutate mosqueId via PATCH (Immutability Enforcement)', async () => {
      const res = await request(app)
        .patch(`/api/v1/study-centers/${center1._id.toString()}`)
        .set('Cookie', superAdminCookie)
        .send({
          mosqueId: mosqueDistrict2._id.toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      // Verify mosqueId in DB remains untouched
      const dbCenter = await studyCenterDao.findById(center1._id);
      expect(dbCenter.mosqueId.toString()).toBe(mosqueDistrict1._id.toString());
    });

    it('should soft deactivate a Study Center (DELETE /api/v1/study-centers/:id)', async () => {
      const res = await request(app)
        .delete(`/api/v1/study-centers/${center1._id.toString()}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      const dbCenter = await studyCenterDao.findById(center1._id);
      expect(dbCenter).toBeDefined();
      expect(dbCenter.isActive).toBe(false);
    });
  });

  // ========================================================
  // 4. DISTRICT ADMIN SCOPE SECURITY TESTS
  // ========================================================
  describe('District Admin Scope Security', () => {
    let centerDistrict1, centerDistrict2;

    beforeEach(async () => {
      centerDistrict1 = await studyCenterDao.create({
        name: 'District 1 Center',
        mosqueId: mosqueDistrict1._id,
        isActive: true
      });

      centerDistrict2 = await studyCenterDao.create({
        name: 'District 2 Center',
        mosqueId: mosqueDistrict2._id,
        isActive: true
      });
    });

    it('should ALLOW District Admin 1 to create a Study Center under Mosque in District 1', async () => {
      const newMosqueD1 = await mosqueDao.create({
        name: 'Another D1 Mosque',
        address: 'D1 Street',
        pincode: '560041',
        areaLocalityId: areaLocality1._id
      });

      const res = await request(app)
        .post('/api/v1/study-centers')
        .set('Cookie', districtAdmin1Cookie)
        .send({
          name: 'New Center D1',
          mosqueId: newMosqueD1._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should DENY District Admin 1 from creating a Study Center under Mosque in District 2 (403 Forbidden)', async () => {
      const newMosqueD2 = await mosqueDao.create({
        name: 'Another D2 Mosque',
        address: 'D2 Street',
        pincode: '570002',
        areaLocalityId: areaLocality2._id
      });

      const res = await request(app)
        .post('/api/v1/study-centers')
        .set('Cookie', districtAdmin1Cookie)
        .send({
          name: 'Unauthorized Center D2',
          mosqueId: newMosqueD2._id.toString()
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should filter list results for District Admin to ONLY show Study Centers in their district', async () => {
      const res = await request(app)
        .get('/api/v1/study-centers')
        .set('Cookie', districtAdmin1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(centerDistrict1._id.toString());
    });

    it('should DENY District Admin 1 from fetching a Study Center in District 2 by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/study-centers/${centerDistrict2._id.toString()}`)
        .set('Cookie', districtAdmin1Cookie);

      expect(res.status).toBe(403);
    });

    it('should DENY District Admin 1 from updating a Study Center in District 2', async () => {
      const res = await request(app)
        .patch(`/api/v1/study-centers/${centerDistrict2._id.toString()}`)
        .set('Cookie', districtAdmin1Cookie)
        .send({ capacity: 99 });

      expect(res.status).toBe(403);
    });

    it('should DENY District Admin 1 from deactivating a Study Center in District 2', async () => {
      const res = await request(app)
        .delete(`/api/v1/study-centers/${centerDistrict2._id.toString()}`)
        .set('Cookie', districtAdmin1Cookie);

      expect(res.status).toBe(403);
    });

    it('should REJECT request payload scope spoofing attempts', async () => {
      const res = await request(app)
        .post('/api/v1/study-centers')
        .set('Cookie', districtAdmin1Cookie)
        .send({
          name: 'Spoofed Center',
          mosqueId: mosqueDistrict2._id.toString(), // Belongs to District 2!
          districtId: district1._id.toString() // Spoofed field
        });

      expect(res.status).toBe(403);
    });
  });

  // ========================================================
  // 5. AUTH & UNPERMITTED ROLE TESTS
  // ========================================================
  describe('Authentication & Role Restrictions', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/study-centers');
      expect(res.status).toBe(401);
    });

    it('should reject requests from unauthorized roles (e.g. Teacher creating Study Center) with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/study-centers')
        .set('Cookie', teacherCookie)
        .send({
          name: 'Teacher Created Center',
          mosqueId: mosqueDistrict1._id.toString()
        });

      expect(res.status).toBe(403);
    });
  });
});
