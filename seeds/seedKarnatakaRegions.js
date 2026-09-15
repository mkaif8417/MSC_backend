/**
 * seedKarnatakaRegions.js
 *
 * Rebuilds Karnataka's location hierarchy at the Division/Region level:
 *   State → Division (4, official govt revenue divisions)
 *         → Region (10, sub-groupings within each division)
 *         → District (31, linked via regionId)
 *
 * This REPLACES seedKarnatakadivisions.js. The old script created 10
 * informal "divisions" and linked District.divisionId directly to them.
 * That field/model shape is gone — District now stores regionId, and
 * Region stores divisionId, giving the correct 2-level split above District.
 *
 * PREREQUISITE: run seedKarnatakaDistrictsTaluka.js first — this script
 * only UPDATES existing District docs, it does not create districts.
 *
 * NAMING NOTE: each division has exactly one region sharing its name
 * (Bengaluru Region under Bengaluru Division, Mysuru Region under Mysuru
 * Division, Belagavi Region under Belagavi Division, Kalaburagi Region
 * under Kalaburagi Division) so the dropdown reads consistently.
 *
 * USAGE
 * -----
 * 1. Place this file in backend/seeds/ next to your other seed scripts.
 * 2. Run:  node seeds/seedKarnatakaRegions.js
 * 3. Delete the old seeds/Seedkarnatakadivisions.js once this has run
 *    successfully — it references the removed District.divisionId field.
 *
 * Idempotent: safe to re-run. Divisions and Regions are matched/upserted
 * by their stable `code` (not `name`), so renaming a `name` here and
 * re-running will RENAME the existing document instead of duplicating it.
 * Each district's regionId is overwritten with the correct value every run.
 */

const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const State = require('../src/models/State');
const District = require('../src/models/District');
const Division = require('../src/models/Division');
const Region = require('../src/models/Region');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  throw new Error('MONGODB_URI is not set. Check your .env (see seedKarnatakaDistrictsTaluka.js for debug pattern).');
}

// ------------------------------------------------------------------
// 4 official Karnataka revenue divisions
// ------------------------------------------------------------------
const DIVISION_DATA = [
  { name: 'Bengaluru Division', code: 'BLRD', hqDistrictName: 'Bengaluru Urban' },
  { name: 'Mysuru Division', code: 'MYSD', hqDistrictName: 'Mysuru' },
  { name: 'Belagavi Division', code: 'BLGD', hqDistrictName: 'Belagavi' },
  { name: 'Kalaburagi Division', code: 'KLBD', hqDistrictName: 'Kalaburagi' }
];

// ------------------------------------------------------------------
// 10 regions, each nested under one of the 4 divisions above.
// District names below MUST match the `name` values used in
// seedKarnatakaDistrictsTaluka.js exactly (including spelling like
// "Bagalkote" and "Chamarajanagara"), since we match districts by name.
//
// Codes stay stable (KLB-R1) even though the display name changed
// from "Bidar Region" to "Kalaburagi Region" — matching by code means
// this rename updates the existing doc instead of creating a duplicate.
// ------------------------------------------------------------------
const REGION_DATA = [
  {
    name: 'Bengaluru Region',
    code: 'BLR-R1',
    divisionCode: 'BLRD',
    districts: ['Bengaluru Urban', 'Bengaluru Rural', 'Ramanagara']
  },
  {
    name: 'Kolar Region',
    code: 'BLR-R2',
    divisionCode: 'BLRD',
    districts: ['Kolar', 'Chikkaballapura']
  },
  {
    name: 'Davanagere Region',
    code: 'BLR-R3',
    divisionCode: 'BLRD',
    districts: ['Davanagere', 'Chitradurga', 'Shivamogga', 'Tumakuru']
  },
  {
    name: 'Mysuru Region',
    code: 'MYS-R1',
    divisionCode: 'MYSD',
    districts: ['Mysuru', 'Mandya', 'Chamarajanagara']
  },
  {
    name: 'Hassan Region',
    code: 'MYS-R2',
    divisionCode: 'MYSD',
    districts: ['Hassan', 'Kodagu']
  },
  {
    name: 'Mangalore Region',
    code: 'MYS-R3',
    divisionCode: 'MYSD',
    districts: ['Dakshina Kannada', 'Udupi', 'Chikkamagaluru']
  },
  {
    name: 'Belagavi Region',
    code: 'BLG-R1',
    divisionCode: 'BLGD',
    districts: ['Belagavi', 'Bagalkote', 'Vijayapura']
  },
  {
    name: 'Dharwad Region',
    code: 'BLG-R2',
    divisionCode: 'BLGD',
    districts: ['Dharwad', 'Gadag', 'Haveri', 'Uttara Kannada']
  },
  {
    name: 'Kalaburagi Region',
    code: 'KLB-R1',
    divisionCode: 'KLBD',
    districts: ['Bidar', 'Kalaburagi', 'Yadgir']
  },
  {
    name: 'Bellary Region',
    code: 'KLB-R2',
    divisionCode: 'KLBD',
    districts: ['Ballari', 'Raichur', 'Koppal', 'Vijayanagara']
  }
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const karnataka = await State.findOne({ code: 'KA' });
  if (!karnataka) {
    throw new Error('Karnataka state (code "KA") not found. Seed State first.');
  }

  // ------------------------------------------------------------------
  // 1. Upsert the 4 divisions
  // ------------------------------------------------------------------
  const divisionByCode = {};
  for (const divData of DIVISION_DATA) {
    const division = await Division.findOneAndUpdate(
      { stateId: karnataka._id, code: divData.code },
      {
        $set: { name: divData.name },
        $setOnInsert: { code: divData.code, stateId: karnataka._id, isActive: true }
      },
      { upsert: true, new: true }
    );
    divisionByCode[divData.code] = division;
    console.log(`✔ Division: ${divData.name}`);
  }

  // Set each division's HQ district pointer (best-effort)
  for (const divData of DIVISION_DATA) {
    const hqDistrict = await District.findOne({ stateId: karnataka._id, name: divData.hqDistrictName });
    if (hqDistrict) {
      await Division.updateOne({ _id: divisionByCode[divData.code]._id }, { hqDistrictId: hqDistrict._id });
    } else {
      console.warn(`⚠ HQ district "${divData.hqDistrictName}" not found for ${divData.name}`);
    }
  }

  // ------------------------------------------------------------------
  // 2. Upsert the 10 regions, each linked to its parent division
  // ------------------------------------------------------------------
  let regionCount = 0;
  let linkedDistrictCount = 0;
  const notFound = [];

  for (const regData of REGION_DATA) {
    const parentDivision = divisionByCode[regData.divisionCode];
    if (!parentDivision) {
      throw new Error(`Region "${regData.name}" references unknown division code "${regData.divisionCode}"`);
    }

    const region = await Region.findOneAndUpdate(
      { divisionId: parentDivision._id, code: regData.code },
      {
        $set: { name: regData.name },
        $setOnInsert: { code: regData.code, divisionId: parentDivision._id, isActive: true }
      },
      { upsert: true, new: true }
    );
    regionCount += 1;

    // Link each district in this region to the region doc
    for (const districtName of regData.districts) {
      const district = await District.findOne({ stateId: karnataka._id, name: districtName });
      if (!district) {
        notFound.push(`${districtName} (expected in ${regData.name} / ${parentDivision.name})`);
        continue;
      }
      district.regionId = region._id;
      await district.save();
      linkedDistrictCount += 1;
    }

    console.log(`  ✔ ${regData.name} (${parentDivision.name}) — ${regData.districts.length} districts linked`);
  }

  console.log(`\nUpserted ${DIVISION_DATA.length} divisions, ${regionCount} regions, linked ${linkedDistrictCount} districts.`);

  if (notFound.length) {
    console.warn('\n⚠ Could not find these districts (check spelling against seedKarnatakaDistrictsTaluka.js):');
    notFound.forEach((n) => console.warn('  - ' + n));
  }

  // ------------------------------------------------------------------
  // 3. Clean up the old, now-removed divisionId field on District docs
  //    (a straggler from the pre-Region schema — harmless but stale)
  // ------------------------------------------------------------------
  const unsetResult = await District.updateMany(
    { stateId: karnataka._id, divisionId: { $exists: true } },
    { $unset: { divisionId: '' } }
  );
  if (unsetResult.modifiedCount > 0) {
    console.log(`✔ Removed stale divisionId field from ${unsetResult.modifiedCount} district doc(s).`);
  }

  // ------------------------------------------------------------------
  // 4. Sanity check: any Karnataka district still missing a region?
  // ------------------------------------------------------------------
  const orphanDistricts = await District.find({ stateId: karnataka._id, regionId: null }).select('name');
  if (orphanDistricts.length) {
    console.warn(`\n⚠ ${orphanDistricts.length} district(s) have NO region assigned:`);
    orphanDistricts.forEach((d) => console.warn('  - ' + d.name));
  } else {
    console.log('\n✔ All Karnataka districts are assigned to a region.');
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});