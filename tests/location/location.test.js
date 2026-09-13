const request = require('supertest');
const app = require('../../src/app');
const stateDao = require('../../src/daos/state.dao');
const districtDao = require('../../src/daos/district.dao');
const talukaDao = require('../../src/daos/taluka.dao');
const villageCityDao = require('../../src/daos/villageCity.dao');
const areaLocalityDao = require('../../src/daos/areaLocality.dao');
const userDao = require('../../src/daos/user.dao');
const { ROLES } = require('../../src/constants/roles');
const { signToken } = require('../../src/utils/jwt');
const env = require('../../src/config/env');
const seedMasterData = require('../../seeds/seedMasterData');
const { setupTestDB, clearTestDB, teardownTestDB } = require('../setup');

describe('Phase 2 — Location Management API Tests', () => {
  let superAdminCookie, districtAdmin1Cookie, districtAdmin2Cookie, teacherCookie;
  let state1, state2, district1, district2, taluka1, villageCity1, areaLocality1;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // 1. Create Test States
    state1 = await stateDao.create({ name: 'Karnataka', code: 'KA', isActive: true });
    state2 = await stateDao.create({ name: 'Maharashtra', code: 'MH', isActive: true });

    // 2. Create Test Districts
    district1 = await districtDao.create({ name: 'Bengaluru Urban', code: 'BLR', stateId: state1._id, isActive: true });
    district2 = await districtDao.create({ name: 'Mysuru', code: 'MYS', stateId: state1._id, isActive: true });

    // 3. Create Test Taluka
    taluka1 = await talukaDao.create({ name: 'Bengaluru South', code: 'BS', districtId: district1._id, isActive: true });

    // 4. Create Test Village/City
    villageCity1 = await villageCityDao.create({ name: 'Jayanagar', code: 'JYN', talukaId: taluka1._id, type: 'CITY', isActive: true });

    // 5. Create Test Area/Locality
    areaLocality1 = await areaLocalityDao.create({ name: '4th Block', code: 'B4', villageCityId: villageCity1._id, pincode: '560041', isActive: true });

    // 6. Create Users & Cookie Session Tokens
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
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // ==========================================
  // 1. STATE API TESTS
  // ==========================================
  describe('State APIs (/api/v1/locations/states)', () => {
    it('should allow Super Admin to create a new State', async () => {
      const res = await request(app)
        .post('/api/v1/locations/states')
        .set('Cookie', superAdminCookie)
        .send({ name: 'Tamil Nadu', code: 'TN' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Tamil Nadu');
      expect(res.body.data.code).toBe('TN');
    });

    it('should reject duplicate State code with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/locations/states')
        .set('Cookie', superAdminCookie)
        .send({ name: 'New Karnataka', code: 'KA' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_RESOURCE');
    });

    it('should reject District Admin from creating, updating, or deactivating a State with 403 Forbidden', async () => {
      const createRes = await request(app)
        .post('/api/v1/locations/states')
        .set('Cookie', districtAdmin1Cookie)
        .send({ name: 'Kerala', code: 'KL' });
      expect(createRes.status).toBe(403);

      const updateRes = await request(app)
        .patch(`/api/v1/locations/states/${state1._id}`)
        .set('Cookie', districtAdmin1Cookie)
        .send({ name: 'Karnataka Modified' });
      expect(updateRes.status).toBe(403);

      const deleteRes = await request(app)
        .delete(`/api/v1/locations/states/${state1._id}`)
        .set('Cookie', districtAdmin1Cookie);
      expect(deleteRes.status).toBe(403);
    });

    it('should list all active states', async () => {
      const res = await request(app)
        .get('/api/v1/locations/states')
        .set('Cookie', teacherCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==============================================
  // 2. DISTRICT API TESTS
  // ==============================================
  describe('District APIs (/api/v1/locations/districts)', () => {
    it('should create district under valid active State', async () => {
      const res = await request(app)
        .post('/api/v1/locations/districts')
        .set('Cookie', superAdminCookie)
        .send({ name: 'Belagavi', code: 'BEL', stateId: state1._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Belagavi');
    });

    it('should reject creating District under non-existent State with 404', async () => {
      const res = await request(app)
        .post('/api/v1/locations/districts')
        .set('Cookie', superAdminCookie)
        .send({ name: 'Invalid District', code: 'INV', stateId: '507f1f77bcf86cd799439011' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject creating District under inactive State with 400', async () => {
      await stateDao.updateById(state1._id, { isActive: false });

      const res = await request(app)
        .post('/api/v1/locations/districts')
        .set('Cookie', superAdminCookie)
        .send({ name: 'Inactive Test District', code: 'ITD', stateId: state1._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent duplicate District name under the same State', async () => {
      const res = await request(app)
        .post('/api/v1/locations/districts')
        .set('Cookie', superAdminCookie)
        .send({ name: 'Bengaluru Urban', code: 'BU2', stateId: state1._id.toString() });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_RESOURCE');
    });

    it('should allow same District name under a DIFFERENT State', async () => {
      const res = await request(app)
        .post('/api/v1/locations/districts')
        .set('Cookie', superAdminCookie)
        .send({ name: 'Bengaluru Urban', code: 'BU3', stateId: state2._id.toString() });

      expect(res.status).toBe(201);
    });

    it('should filter districts by parent stateId (Cascading API)', async () => {
      const res = await request(app)
        .get(`/api/v1/locations/districts?stateId=${state1._id}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every((d) => d.stateId.toString() === state1._id.toString())).toBe(true);
    });

    it('should restrict District Admin list view to assigned district scope', async () => {
      const res = await request(app)
        .get('/api/v1/locations/districts')
        .set('Cookie', districtAdmin1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id).toBe(district1._id.toString());
    });

    it('should reject District Admin 1 from modifying District 2 with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/v1/locations/districts/${district2._id}`)
        .set('Cookie', districtAdmin1Cookie)
        .send({ name: 'Mysuru Updated' });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // 3. TALUKA API TESTS
  // ============================================
  describe('Taluka APIs (/api/v1/locations/talukas)', () => {
    it('should allow District Admin 1 to create Taluka under assigned District 1', async () => {
      const res = await request(app)
        .post('/api/v1/locations/talukas')
        .set('Cookie', districtAdmin1Cookie)
        .send({ name: 'Bengaluru North', code: 'BN', districtId: district1._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Bengaluru North');
    });

    it('should DENY District Admin 1 from creating Taluka under unassigned District 2', async () => {
      const res = await request(app)
        .post('/api/v1/locations/talukas')
        .set('Cookie', districtAdmin1Cookie)
        .send({ name: 'Nanjangud', code: 'NJG', districtId: district2._id.toString() });

      expect(res.status).toBe(403);
    });

    it('should filter talukas by parent districtId (Cascading API)', async () => {
      const res = await request(app)
        .get(`/api/v1/locations/talukas?districtId=${district1._id}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Bengaluru South');
    });
  });

  // ====================================================
  // 4. VILLAGE/CITY API TESTS
  // ====================================================
  describe('Village/City APIs (/api/v1/locations/villages-cities)', () => {
    it('should create Village/City under valid Taluka', async () => {
      const res = await request(app)
        .post('/api/v1/locations/villages-cities')
        .set('Cookie', districtAdmin1Cookie)
        .send({ name: 'BTM Layout', code: 'BTM', talukaId: taluka1._id.toString(), type: 'CITY' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('BTM Layout');
      expect(res.body.data.type).toBe('CITY');
    });

    it('should reject District Admin 2 from creating Village/City under District 1 Taluka', async () => {
      const res = await request(app)
        .post('/api/v1/locations/villages-cities')
        .set('Cookie', districtAdmin2Cookie)
        .send({ name: 'Unauthorized Village', code: 'UV', talukaId: taluka1._id.toString() });

      expect(res.status).toBe(403);
    });

    it('should filter villages-cities by parent talukaId (Cascading API)', async () => {
      const res = await request(app)
        .get(`/api/v1/locations/villages-cities?talukaId=${taluka1._id}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Jayanagar');
    });
  });

  // =======================================================
  // 5. AREA/LOCALITY API TESTS
  // =======================================================
  describe('Area/Locality APIs (/api/v1/locations/areas-localities)', () => {
    it('should create Area/Locality under valid Village/City', async () => {
      const res = await request(app)
        .post('/api/v1/locations/areas-localities')
        .set('Cookie', districtAdmin1Cookie)
        .send({ name: '9th Block', code: 'B9', villageCityId: villageCity1._id.toString(), pincode: '560069' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('9th Block');
    });

    it('should DENY District Admin 2 from creating Area/Locality under District 1 hierarchy', async () => {
      const res = await request(app)
        .post('/api/v1/locations/areas-localities')
        .set('Cookie', districtAdmin2Cookie)
        .send({ name: 'Cross-District Area', code: 'CDA', villageCityId: villageCity1._id.toString() });

      expect(res.status).toBe(403);
    });

    it('should filter areas-localities by parent villageCityId (Cascading API)', async () => {
      const res = await request(app)
        .get(`/api/v1/locations/areas-localities?villageCityId=${villageCity1._id}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('4th Block');
    });
  });

  // =======================================================
  // 6. VALIDATION & SECURITY CHECKS
  // =======================================================
  describe('API Input Validation & Malformed ID Checks', () => {
    it('should reject malformed ObjectId strings with 400 Validation Error', async () => {
      const res = await request(app)
        .get('/api/v1/locations/states/invalid-id-string')
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // =======================================================
  // 7. KARNATAKA SEEDING TEST
  // =======================================================
  describe('Master Data Seeder - Karnataka State', () => {
    it('should seed Karnataka state idempotently', async () => {
      await seedMasterData(false);
      const kaState = await stateDao.findByCode('KA');
      expect(kaState).toBeDefined();
      expect(kaState.name).toBe('Karnataka');
    });
  });
});
