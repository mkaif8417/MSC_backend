const { connectDB, disconnectDB } = require('../src/config/db');
const userDao = require('../src/daos/user.dao');
const stateDao = require('../src/daos/state.dao');
const env = require('../src/config/env');
const { ROLES } = require('../src/constants/roles');

/**
 * Master Data Seeder
 * - Seeds initial Super Admin application user idempotently
 * - Seeds default State "Karnataka" (code: "KA") idempotently
 * @param {Boolean} shouldDisconnect Whether to close database connection upon completion
 */
async function seedMasterData(shouldDisconnect = (require.main === module)) {
  console.log('[Seeder] Starting Master Data Seeding...');
  
  try {
    await connectDB();

    // 1. Seed Super Admin User
    const adminEmail = env.SEED_ADMIN_EMAIL.toLowerCase().trim();
    const existingAdmin = await userDao.findByEmail(adminEmail);

    if (existingAdmin) {
      console.log(`[Seeder] Super Admin with email "${adminEmail}" already exists. Skipping.`);
    } else {
      console.log(`[Seeder] Creating Super Admin account for "${adminEmail}"...`);

      const superAdminData = {
        name: env.SEED_ADMIN_NAME,
        email: adminEmail,
        passwordHash: env.SEED_ADMIN_PASSWORD,
        role: ROLES.SUPER_ADMIN,
        scope: {
          type: 'GLOBAL',
          districtId: null,
          studyCenterId: null
        },
        isActive: true
      };

      const createdAdmin = await userDao.createUser(superAdminData);
      console.log(`[Seeder] Super Admin created successfully. ID: ${createdAdmin._id}`);
    }

    // 2. Seed Default State: Karnataka
    const defaultStateCode = 'KA';
    const defaultStateName = 'Karnataka';
    const existingState = await stateDao.findByCode(defaultStateCode);

    if (existingState) {
      console.log(`[Seeder] Default State "${defaultStateName}" (${defaultStateCode}) already exists. Skipping.`);
    } else {
      console.log(`[Seeder] Creating Default State "${defaultStateName}" (${defaultStateCode})...`);
      const createdState = await stateDao.create({
        name: defaultStateName,
        code: defaultStateCode,
        isActive: true
      });
      console.log(`[Seeder] State "${defaultStateName}" created successfully. ID: ${createdState._id}`);
    }

    console.log('[Seeder] Master Data Seeding complete!');
  } catch (error) {
    console.error('[Seeder] Error during seeding execution:', error.message);
    if (shouldDisconnect) process.exitCode = 1;
    throw error;
  } finally {
    if (shouldDisconnect) {
      await disconnectDB();
    }
  }
}

// Execute if run directly via CLI (node seeds/seedMasterData.js)
if (require.main === module) {
  seedMasterData(true);
}

module.exports = seedMasterData;
