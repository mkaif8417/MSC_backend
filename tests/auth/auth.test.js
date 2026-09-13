const request = require('supertest');
const app = require('../../src/app');
const userDao = require('../../src/daos/user.dao');
const { ROLES } = require('../../src/constants/roles');
const { setupTestDB, clearTestDB, teardownTestDB } = require('../setup');

describe('Authentication API Tests (/api/v1/auth)', () => {
  let testUser;
  const rawPassword = 'TestUserPassword@123';

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Create test active user
    testUser = await userDao.createUser({
      name: 'Auth Test User',
      email: 'testuser@masjidcenter.org',
      passwordHash: rawPassword,
      role: ROLES.MOSQUE_CENTER_ADMIN,
      scope: {
        type: 'CENTER',
        districtId: null,
        studyCenterId: null
      },
      isActive: true
    });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate valid credentials, set HTTP-Only cookie, and return user profile without passwordHash', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@masjidcenter.org',
          password: rawPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('testuser@masjidcenter.org');
      expect(res.body.data.user.role).toBe(ROLES.MOSQUE_CENTER_ADMIN);
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Security check: passwordHash excluded

      // Verify Set-Cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('masjid_center_token=');
      expect(cookies[0].toLowerCase()).toContain('httponly');
    });

    it('should reject invalid password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@masjidcenter.org',
          password: 'WrongPassword999'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user email with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@masjidcenter.org',
          password: rawPassword
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject deactivated user with 403 Forbidden', async () => {
      await userDao.updateById(testUser._id, { isActive: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@masjidcenter.org',
          password: rawPassword
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
    });

    it('should reject missing email or password with 400 Validation Error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return profile for authenticated user via cookie', async () => {
      // 1. Login to get cookie
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@masjidcenter.org',
          password: rawPassword
        });

      const authCookie = loginRes.headers['set-cookie'];

      // 2. Access /me
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('testuser@masjidcenter.org');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject unauthenticated request without cookie with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear authentication cookie on logout', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const cookies = res.headers['set-cookie'];
      expect(cookies[0]).toContain('masjid_center_token=;');
    });
  });
});
