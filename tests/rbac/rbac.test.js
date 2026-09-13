const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { requireRoles, requirePermissions } = require('../../src/middlewares/rbac.middleware');
const { authenticate } = require('../../src/middlewares/auth.middleware');
const { ROLES } = require('../../src/constants/roles');
const { PERMISSIONS } = require('../../src/constants/permissions');
const { signToken } = require('../../src/utils/jwt');
const userDao = require('../../src/daos/user.dao');
const env = require('../../src/config/env');
const { setupTestDB, clearTestDB, teardownTestDB } = require('../setup');
const ApiResponse = require('../../src/utils/apiResponse');

// Create test Express instance for RBAC middleware testing
const testApp = express();
testApp.use(express.json());
testApp.use(cookieParser());

testApp.get(
  '/api/v1/test/super-admin-only',
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN),
  (req, res) => ApiResponse.success(res, 200, 'Super Admin Access Granted', { user: req.user })
);

testApp.get(
  '/api/v1/test/district-admin-only',
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.DISTRICT_ADMIN),
  (req, res) => ApiResponse.success(res, 200, 'District Admin Access Granted', { user: req.user })
);

testApp.get(
  '/api/v1/test/location-read-permission',
  authenticate,
  requirePermissions(PERMISSIONS.STATE_READ),
  (req, res) => ApiResponse.success(res, 200, 'State Read Access Granted', { user: req.user })
);

// Service-layer scope authorization demonstration using test fixtures
function authorizeScopeAccess(userContext, targetResourceId, targetScope) {
  // 1. Super admin can access everything
  if (userContext.role === ROLES.SUPER_ADMIN) return true;

  // 2. District Admin restricted to matching districtId
  if (userContext.role === ROLES.DISTRICT_ADMIN) {
    return userContext.scope && userContext.scope.districtId === targetScope.districtId;
  }

  // 3. Center Admin / Teacher / Operator restricted to matching studyCenterId
  if (userContext.scope && userContext.scope.studyCenterId) {
    return userContext.scope.studyCenterId === targetScope.studyCenterId;
  }

  return false;
}

describe('RBAC & Scope Framework Middleware Tests', () => {
  let superAdminToken, districtAdminToken, teacherToken;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create Super Admin User
    const superAdmin = await userDao.createUser({
      name: 'Super Admin User',
      email: 'superadmin@masjidcenter.org',
      passwordHash: 'Pass@123',
      role: ROLES.SUPER_ADMIN,
      scope: { type: 'GLOBAL' },
      isActive: true
    });

    // Create District Admin User
    const districtAdmin = await userDao.createUser({
      name: 'District Admin User',
      email: 'districtadmin@masjidcenter.org',
      passwordHash: 'Pass@123',
      role: ROLES.DISTRICT_ADMIN,
      scope: { type: 'DISTRICT', districtId: 'district_123' },
      isActive: true
    });

    // Create Teacher User
    const teacher = await userDao.createUser({
      name: 'Teacher User',
      email: 'teacher@masjidcenter.org',
      passwordHash: 'Pass@123',
      role: ROLES.TEACHER,
      scope: { type: 'CENTER', studyCenterId: 'center_789' },
      isActive: true
    });

    superAdminToken = `${env.AUTH_COOKIE_NAME}=${signToken({ id: superAdmin._id.toString(), role: superAdmin.role })}`;
    districtAdminToken = `${env.AUTH_COOKIE_NAME}=${signToken({ id: districtAdmin._id.toString(), role: districtAdmin.role })}`;
    teacherToken = `${env.AUTH_COOKIE_NAME}=${signToken({ id: teacher._id.toString(), role: teacher.role })}`;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Role Authorization Checks', () => {
    it('should allow Super Admin to access super-admin-only route', async () => {
      const res = await request(testApp)
        .get('/api/v1/test/super-admin-only')
        .set('Cookie', [superAdminToken]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny Teacher from accessing super-admin-only route with 403 Forbidden', async () => {
      const res = await request(testApp)
        .get('/api/v1/test/super-admin-only')
        .set('Cookie', [teacherToken]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow District Admin to access district-admin route', async () => {
      const res = await request(testApp)
        .get('/api/v1/test/district-admin-only')
        .set('Cookie', [districtAdminToken]);

      expect(res.status).toBe(200);
    });
  });

  describe('Permission Matrix Checks', () => {
    it('should allow user with STATE_READ permission', async () => {
      const res = await request(testApp)
        .get('/api/v1/test/location-read-permission')
        .set('Cookie', [teacherToken]);

      expect(res.status).toBe(200);
    });
  });

  describe('Service Scope Authorization Fixture Tests', () => {
    it('should allow Super Admin to access any resource fixture', () => {
      const userContext = { role: ROLES.SUPER_ADMIN };
      const resourceScope = { districtId: 'district_999', studyCenterId: 'center_999' };
      expect(authorizeScopeAccess(userContext, 'res_1', resourceScope)).toBe(true);
    });

    it('should allow District Admin to access resources within their assigned district', () => {
      const userContext = { role: ROLES.DISTRICT_ADMIN, scope: { districtId: 'district_123' } };
      const resourceInDistrict = { districtId: 'district_123' };
      const resourceOtherDistrict = { districtId: 'district_999' };

      expect(authorizeScopeAccess(userContext, 'res_1', resourceInDistrict)).toBe(true);
      expect(authorizeScopeAccess(userContext, 'res_2', resourceOtherDistrict)).toBe(false);
    });

    it('should allow Center Admin/Teacher to access resources within their assigned study center', () => {
      const userContext = { role: ROLES.TEACHER, scope: { studyCenterId: 'center_789' } };
      const resourceInCenter = { studyCenterId: 'center_789' };
      const resourceOtherCenter = { studyCenterId: 'center_999' };

      expect(authorizeScopeAccess(userContext, 'res_1', resourceInCenter)).toBe(true);
      expect(authorizeScopeAccess(userContext, 'res_2', resourceOtherCenter)).toBe(false);
    });
  });
});
