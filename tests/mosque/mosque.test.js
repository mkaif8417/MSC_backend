const request = require('supertest');
const app = require('../../src/app');
const stateDao = require('../../src/daos/state.dao');
const districtDao = require('../../src/daos/district.dao');
const talukaDao = require('../../src/daos/taluka.dao');
const villageCityDao = require('../../src/daos/villageCity.dao');
const areaLocalityDao = require('../../src/daos/areaLocality.dao');
const mosqueDao = require('../../src/daos/mosque.dao');
const userDao = require('../../src/daos/user.dao');
const { ROLES } = require('../../src/constants/roles');
const { signToken } = require('../../src/utils/jwt');
const env = require('../../src/config/env');
const { setupTestDB, clearTestDB, teardownTestDB } = require('../setup');

describe('Phase 3 — Mosque Management API Tests', () => {
  let superAdminCookie, districtAdmin1Cookie, districtAdmin2Cookie, teacherCookie;
  let state1, district1, district2, taluka1, taluka2, villageCity1, villageCity2;
  let areaLocality1, areaLocality2, inactiveAreaLocality;

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

    inactiveAreaLocality = await areaLocalityDao.create({
      name: 'Old Layout',
      code: 'OLD',
      villageCityId: villageCity1._id,
      pincode: '560041',
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
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // ========================================================
  // 1. MOSQUE CREATION TESTS
  // ========================================================
  describe('Mosque Creation (POST /api/v1/locations/mosques)', () => {
    it('should allow Super Admin to create a valid Mosque with full fields', async () => {
      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Jamia Masjid 4th Block',
          address: 'Main Road, 4th Block, Jayanagar',
          pincode: '560041',
          areaLocalityId: areaLocality1._id.toString(),
          latitude: 12.925,
          longitude: 77.5938,
          googleMapsUrl: 'https://maps.google.com/?q=12.925,77.5938',
          capacity: 500,
          inchargeName: 'Imam Ahmad',
          contactNumber: '+919876543210'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Jamia Masjid 4th Block');
      expect(res.body.data.areaLocalityId.toString()).toBe(areaLocality1._id.toString());
      expect(res.body.data.locationPin).toBeDefined();
      expect(res.body.data.locationPin.coordinates).toEqual([77.5938, 12.925]);
    });

    it('should reject creation if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Incomplete Mosque'
          // Missing address, pincode, areaLocalityId
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation with malformed Area/Locality ID', async () => {
      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Test Mosque',
          address: '123 Street',
          pincode: '560041',
          areaLocalityId: 'invalid-hex-id'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation with nonexistent Area/Locality ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Test Mosque',
          address: '123 Street',
          pincode: '560041',
          areaLocalityId: fakeId
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation under an inactive Area/Locality', async () => {
      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Test Mosque Inactive Parent',
          address: '123 Street',
          pincode: '560041',
          areaLocalityId: inactiveAreaLocality._id.toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/inactive/i);
    });

    it('should reject creation of duplicate Mosque name within the same Area/Locality', async () => {
      await mosqueDao.create({
        name: 'Central Mosque',
        address: '123 Street',
        pincode: '560041',
        areaLocalityId: areaLocality1._id
      });

      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Central Mosque',
          address: '456 Another St',
          pincode: '560041',
          areaLocalityId: areaLocality1._id.toString()
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should allow creation of a Mosque with the same name in a DIFFERENT Area/Locality', async () => {
      await mosqueDao.create({
        name: 'Central Mosque',
        address: '123 Street',
        pincode: '560041',
        areaLocalityId: areaLocality1._id
      });

      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', superAdminCookie)
        .send({
          name: 'Central Mosque',
          address: '789 Mysuru Rd',
          pincode: '570002',
          areaLocalityId: areaLocality2._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ========================================================
  // 2. READ / SEARCH / FILTERING TESTS
  // ========================================================
  describe('Mosque Retrieval & Filtering (GET /api/v1/locations/mosques)', () => {
    let mosque1, mosque2, mosque3;

    beforeEach(async () => {
      mosque1 = await mosqueDao.create({
        name: 'Jamia Masjid 4th Block',
        address: 'Main Road Jayanagar',
        pincode: '560041',
        areaLocalityId: areaLocality1._id,
        capacity: 300,
        isActive: true
      });

      mosque2 = await mosqueDao.create({
        name: 'Bilal Mosque 4th Block',
        address: 'Cross Road Jayanagar',
        pincode: '560041',
        areaLocalityId: areaLocality1._id,
        capacity: 150,
        isActive: false
      });

      mosque3 = await mosqueDao.create({
        name: 'Royal Mosque VV Mohalla',
        address: 'VV Mohalla Main Rd',
        pincode: '570002',
        areaLocalityId: areaLocality2._id,
        capacity: 400,
        isActive: true
      });
    });

    it('should allow Super Admin to list all Mosques with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/locations/mosques')
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('should filter Mosques by areaLocalityId', async () => {
      const res = await request(app)
        .get(`/api/v1/locations/mosques?areaLocalityId=${areaLocality1._id.toString()}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter Mosques by villageCityId cascading filter', async () => {
      const res = await request(app)
        .get(`/api/v1/locations/mosques?villageCityId=${villageCity1._id.toString()}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter Mosques by districtId cascading filter', async () => {
      const res = await request(app)
        .get(`/api/v1/locations/mosques?districtId=${district2._id.toString()}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Royal Mosque VV Mohalla');
    });

    it('should search Mosques by keyword in name or address', async () => {
      const res = await request(app)
        .get('/api/v1/locations/mosques?search=Bilal')
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Bilal Mosque 4th Block');
    });

    it('should filter Mosques by isActive status', async () => {
      const res = await request(app)
        .get('/api/v1/locations/mosques?isActive=true')
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should fetch Mosque by ID with populated areaLocalityId', async () => {
      const res = await request(app)
        .get(`/api/v1/locations/mosques/${mosque1._id.toString()}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(mosque1._id.toString());
      expect(res.body.data.areaLocalityId.name).toBe('4th Block');
    });
  });

  // ========================================================
  // 3. MOSQUE UPDATE & DEACTIVATION TESTS
  // ========================================================
  describe('Mosque Update & Deactivation', () => {
    let mosque1;

    beforeEach(async () => {
      mosque1 = await mosqueDao.create({
        name: 'Jamia Mosque',
        address: 'Initial Address',
        pincode: '560041',
        areaLocalityId: areaLocality1._id,
        capacity: 200,
        isActive: true
      });
    });

    it('should update Mosque fields successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/locations/mosques/${mosque1._id.toString()}`)
        .set('Cookie', superAdminCookie)
        .send({
          capacity: 450,
          inchargeName: 'Maulana Hassan'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.capacity).toBe(450);
      expect(res.body.data.inchargeName).toBe('Maulana Hassan');
    });

    it('should reject update if resulting name conflicts in same AreaLocality', async () => {
      await mosqueDao.create({
        name: 'Noor Mosque',
        address: 'Noor Street',
        pincode: '560041',
        areaLocalityId: areaLocality1._id
      });

      const res = await request(app)
        .patch(`/api/v1/locations/mosques/${mosque1._id.toString()}`)
        .set('Cookie', superAdminCookie)
        .send({ name: 'Noor Mosque' });

      expect(res.status).toBe(409);
    });

    it('should soft deactivate a Mosque (DELETE /api/v1/locations/mosques/:id)', async () => {
      const res = await request(app)
        .delete(`/api/v1/locations/mosques/${mosque1._id.toString()}`)
        .set('Cookie', superAdminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      const dbMosque = await mosqueDao.findById(mosque1._id);
      expect(dbMosque).toBeDefined();
      expect(dbMosque.isActive).toBe(false);
    });
  });

  // ========================================================
  // 4. DISTRICT ADMIN SCOPE SECURITY TESTS
  // ========================================================
  describe('District Admin Scope Security', () => {
    let mosqueDistrict1, mosqueDistrict2;

    beforeEach(async () => {
      mosqueDistrict1 = await mosqueDao.create({
        name: 'District 1 Mosque',
        address: 'Address D1',
        pincode: '560041',
        areaLocalityId: areaLocality1._id,
        isActive: true
      });

      mosqueDistrict2 = await mosqueDao.create({
        name: 'District 2 Mosque',
        address: 'Address D2',
        pincode: '570002',
        areaLocalityId: areaLocality2._id,
        isActive: true
      });
    });

    it('should ALLOW District Admin 1 to create a Mosque under District 1', async () => {
      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', districtAdmin1Cookie)
        .send({
          name: 'New D1 Mosque',
          address: 'Address New D1',
          pincode: '560041',
          areaLocalityId: areaLocality1._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should DENY District Admin 1 from creating a Mosque under District 2 (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', districtAdmin1Cookie)
        .send({
          name: 'Unauthorized D2 Mosque',
          address: 'Address D2',
          pincode: '570002',
          areaLocalityId: areaLocality2._id.toString()
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should filter list results for District Admin to ONLY show Mosques in their district', async () => {
      const res = await request(app)
        .get('/api/v1/locations/mosques')
        .set('Cookie', districtAdmin1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(mosqueDistrict1._id.toString());
    });

    it('should DENY District Admin 1 from fetching a Mosque in District 2 by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/locations/mosques/${mosqueDistrict2._id.toString()}`)
        .set('Cookie', districtAdmin1Cookie);

      expect(res.status).toBe(403);
    });

    it('should DENY District Admin 1 from updating a Mosque in District 2', async () => {
      const res = await request(app)
        .patch(`/api/v1/locations/mosques/${mosqueDistrict2._id.toString()}`)
        .set('Cookie', districtAdmin1Cookie)
        .send({ capacity: 999 });

      expect(res.status).toBe(403);
    });

    it('should DENY District Admin 1 from moving a Mosque from District 1 to District 2 via update', async () => {
      const res = await request(app)
        .patch(`/api/v1/locations/mosques/${mosqueDistrict1._id.toString()}`)
        .set('Cookie', districtAdmin1Cookie)
        .send({ areaLocalityId: areaLocality2._id.toString() });

      expect(res.status).toBe(403);
    });

    it('should DENY District Admin 1 from deactivating a Mosque in District 2', async () => {
      const res = await request(app)
        .delete(`/api/v1/locations/mosques/${mosqueDistrict2._id.toString()}`)
        .set('Cookie', districtAdmin1Cookie);

      expect(res.status).toBe(403);
    });

    it('should REJECT scope spoofing where client passes districtId: District 1 but areaLocalityId: District 2', async () => {
      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', districtAdmin1Cookie)
        .send({
          name: 'Spoofed Mosque',
          address: 'Address Spoofed',
          pincode: '570002',
          areaLocalityId: areaLocality2._id.toString(), // Belongs to District 2!
          districtId: district1._id.toString() // Spoofed query/body field
        });

      expect(res.status).toBe(403);
    });
  });

  // ========================================================
  // 5. AUTH & UNPERMITTED ROLE TESTS
  // ========================================================
  describe('Authentication & Role Restrictions', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/locations/mosques');
      expect(res.status).toBe(401);
    });

    it('should reject requests from unauthorized roles (e.g. Teacher creating Mosque) with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/locations/mosques')
        .set('Cookie', teacherCookie)
        .send({
          name: 'Teacher Created Mosque',
          address: '123 St',
          pincode: '560041',
          areaLocalityId: areaLocality1._id.toString()
        });

      expect(res.status).toBe(403);
    });
  });
});
