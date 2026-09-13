/**
 * seedKarnatakaDivisions.js
 *
 * Creates the 10 revenue divisions for Karnataka and links each of the
 * 31 already-seeded District documents to its division via `divisionId`.
 *
 * PREREQUISITE: run seedKarnatakaDistrictsTaluka.js first — this script
 * only UPDATES existing District docs, it does not create districts.
 *
 * USAGE
 * -----
 * 1. Place this file in backend/seeds/ next to seedKarnatakaDistrictsTaluka.js
 * 2. Run:  node seeds/seedKarnatakaDivisions.js
 *
 * Idempotent: safe to re-run. Divisions are matched/upserted by their
 * stable `code` (not `name`), so renaming a division's `name` here and
 * re-running will RENAME the existing document instead of creating a
 * duplicate. Each district's divisionId is simply overwritten with the
 * correct value every run.
 */

const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const State = require('../src/models/State');
const District = require('../src/models/District');
const Division = require('../src/models/Division');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  throw new Error('MONGODB_URI is not set. Check your .env (see seedKarnatakaDistrictsTaluka.js for debug pattern).');
}

// District names below MUST match the `name` values used in
// seedKarnatakaDistrictsTaluka.js exactly (including spelling like
// "Bagalkote" and "Chamarajanagara"), since we match districts by name.
const DIVISION_DATA = [
  {
    name: 'Belagavi Division',
    code: 'BLGD',
    hqDistrictName: 'Belagavi',
    districts: ['Belagavi', 'Bagalkote', 'Vijayapura']
  },

  {
    name: 'Dharwad Division',
    code: 'DWDD',
    hqDistrictName: 'Dharwad',
    districts: ['Dharwad', 'Gadag', 'Haveri']
  },

  {
    name: 'Shivamogga Division',
    code: 'UKND',
    hqDistrictName: 'Shivamogga',
    districts: ['Uttara Kannada', 'Shivamogga', 'Udupi']
  },

  {
    name: 'Mangalore Division',
    code: 'CSTD',
    hqDistrictName: 'Dakshina Kannada',
    districts: ['Dakshina Kannada', 'Kodagu', 'Chikkamagaluru']
  },

  {
    name: 'Davanagere Division',
    code: 'CNTD',
    hqDistrictName: 'Davanagere',
    districts: ['Davanagere', 'Chitradurga', 'Vijayanagara']
  },

  {
    name: 'Bidar Division',
    code: 'HKND',
    hqDistrictName: 'Bidar',
    districts: ['Bidar', 'Kalaburagi', 'Yadgir']
  },

  {
    name: 'Bellary Division',
    code: 'HKSD',
    hqDistrictName: 'Ballari',
    districts: ['Ballari', 'Raichur', 'Koppal']
  },

  {
    name: 'Bengaluru Division',
    code: 'BLRD',
    hqDistrictName: 'Bengaluru Urban',
    districts: [
      'Bengaluru Urban',
      'Bengaluru Rural',
      'Kolar',
      'Chikkaballapura'
    ]
  },

  {
    name: 'Tumakuru-Hassan Division',
    code: 'TMHD',
    hqDistrictName: 'Tumakuru',
    districts: ['Tumakuru', 'Hassan', 'Mandya']
  },

  {
    name: 'Mysuru Division',
    code: 'MYSD',
    hqDistrictName: 'Mysuru',
    districts: ['Mysuru', 'Chamarajanagara', 'Ramanagara']
  }
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const karnataka = await State.findOne({ code: 'KA' });
  if (!karnataka) {
    throw new Error('Karnataka state (code "KA") not found. Seed State first.');
  }

  let divisionCount = 0;
  let linkedDistrictCount = 0;
  const notFound = [];

  for (const divData of DIVISION_DATA) {
    // Matched by `code` (stable identifier), not `name` — this means
    // renaming `name` above and re-running will correctly RENAME the
    // existing division doc instead of creating a duplicate with the
    // old doc left orphaned.
    const division = await Division.findOneAndUpdate(
      { stateId: karnataka._id, code: divData.code },
      {
        $set: {
          name: divData.name
        },
        $setOnInsert: {
          code: divData.code,
          stateId: karnataka._id,
          isActive: true
        }
      },
      { upsert: true, new: true }
    );
    divisionCount += 1;

    // Link each district in this division to the division doc
    for (const districtName of divData.districts) {
      const district = await District.findOne({ stateId: karnataka._id, name: districtName });
      if (!district) {
        notFound.push(`${districtName} (expected in ${divData.name})`);
        continue;
      }
      district.divisionId = division._id;
      await district.save();
      linkedDistrictCount += 1;
    }

    // Set HQ pointer (best-effort; skip silently if HQ district name has a typo)
    const hqDistrict = await District.findOne({ stateId: karnataka._id, name: divData.hqDistrictName });
    if (hqDistrict) {
      division.hqDistrictId = hqDistrict._id;
      await division.save();
    }

    console.log(`✔ ${divData.name} — ${divData.districts.length} districts linked (HQ: ${divData.hqDistrictName})`);
  }

  console.log(`\nUpserted ${divisionCount} divisions, linked ${linkedDistrictCount} districts.`);

  if (notFound.length) {
    console.warn('\n⚠ Could not find these districts (check spelling against seedKarnatakaDistrictsTaluka.js):');
    notFound.forEach((n) => console.warn('  - ' + n));
  }

  // Sanity check: any Karnataka district still missing a division?
  const orphanDistricts = await District.find({ stateId: karnataka._id, divisionId: null }).select('name');
  if (orphanDistricts.length) {
    console.warn(`\n⚠ ${orphanDistricts.length} district(s) have NO division assigned:`);
    orphanDistricts.forEach((d) => console.warn('  - ' + d.name));
  } else {
    console.log('\n✔ All Karnataka districts are assigned to a division.');
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});