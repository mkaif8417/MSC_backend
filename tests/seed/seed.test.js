const seedMasterData = require('../../seeds/seedMasterData');
const userDao = require('../../src/daos/user.dao');
const User = require('../../src/models/User');
const env = require('../../src/config/env');
const { ROLES } = require('../../src/constants/roles');
const { setupTestDB, clearTestDB, teardownTestDB } = require('../setup');

describe('Master Data Seeder Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should seed initial Super Admin account with hashed password', async () => {
    await seedMasterData();

    const adminEmail = env.SEED_ADMIN_EMAIL.toLowerCase().trim();
    const adminUser = await userDao.findByLoginWithPassword(adminEmail);

    expect(adminUser).toBeDefined();
    expect(adminUser.email).toBe(adminEmail);
    expect(adminUser.role).toBe(ROLES.SUPER_ADMIN);
    expect(adminUser.scope.type).toBe('GLOBAL');
    expect(adminUser.passwordHash).toBeDefined();
    expect(adminUser.passwordHash).not.toBe(env.SEED_ADMIN_PASSWORD); // Must be hashed with bcrypt

    // Verify password match
    const isMatch = await adminUser.comparePassword(env.SEED_ADMIN_PASSWORD);
    expect(isMatch).toBe(true);
  });

  it('should be idempotent and not duplicate Super Admin when executed multiple times', async () => {
    // Execute 1st time
    await seedMasterData();
    const countAfterFirst = await User.countDocuments({ role: ROLES.SUPER_ADMIN });
    expect(countAfterFirst).toBe(1);

    // Execute 2nd time
    await seedMasterData();
    const countAfterSecond = await User.countDocuments({ role: ROLES.SUPER_ADMIN });
    expect(countAfterSecond).toBe(1); // Count remains 1
  });
});
