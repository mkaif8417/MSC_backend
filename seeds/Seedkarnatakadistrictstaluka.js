/**
 * seedKarnatakaDistrictsTaluka.js
 *
 * Populates District and Taluka collections for the state of Karnataka.
 * Data source: Wikipedia "List of districts of Karnataka" (31 districts, official taluk lists).
 *
 * USAGE
 * -----
 * 1. Place this file in backend/seeds/ (same folder as your other seed scripts).
 * 2. Adjust the require paths below to match your project (they assume
 *    backend/seeds/<this file> and backend/src/models/*).
 * 3. Run:  node seeds/seedKarnatakaDistrictsTaluka.js
 *
 * The script is idempotent — running it multiple times will not create duplicates,
 * it uses upsert (findOneAndUpdate + upsert:true) keyed on the unique compound indexes
 * you already defined (stateId+name for District, districtId+name for Taluka).
 */

const path = require('path');
const fs = require('fs');

// Explicitly point at backend/.env regardless of where node was invoked from
const envPath = path.join(__dirname, '..', '.env');
const dotenvResult = require('dotenv').config({ path: envPath });

const mongoose = require('mongoose');

// ---- adjust these paths to match your project structure ----
const State = require('../src/models/State');
const District = require('../src/models/District');
const Taluka = require('../src/models/Taluka');
// --------------------------------------------------------------

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('--- DEBUG: MONGODB_URI could not be loaded ---');
  console.error('Looking for .env at:', envPath);
  console.error('.env file exists at that path:', fs.existsSync(envPath));
  if (dotenvResult.error) {
    console.error('dotenv error:', dotenvResult.error.message);
  } else {
    console.error('Keys dotenv found in .env:', dotenvResult.parsed ? Object.keys(dotenvResult.parsed) : '(none)');
  }
  throw new Error('MONGODB_URI is not set. See debug output above.');
}

// 31 districts of Karnataka with their taluks.
// code = unique 3-4 letter district code (hand-picked to avoid collisions).
const KARNATAKA_DATA = [
  { name: 'Bagalkote', code: 'BGK', taluks: ['Badami', 'Bagalkote', 'Bilagi', 'Hunagunda', 'Jamkhandi', 'Mudhol', 'Guledgudda', 'Rabkavi Banhatti', 'Ilkal'] },
  { name: 'Ballari', code: 'BLY', taluks: ['Ballari', 'Kampli', 'Kurugodu', 'Sanduru', 'Siruguppa'] },
  { name: 'Belagavi', code: 'BGM', taluks: ['Athani', 'Bailhongal', 'Belagavi', 'Chikodi', 'Gokak', 'Hukkeri', 'Khanapur', 'Kagwad', 'Mudalagi', 'Nippani', 'Kittur', 'Raybag', 'Ramdurg', 'Saundatti', 'Yaragatti'] },
  { name: 'Bengaluru Urban', code: 'BLR', taluks: ['Bengaluru North', 'Bengaluru South', 'Bengaluru East', 'Anekal', 'Yelahanka'] },
  { name: 'Bengaluru Rural', code: 'BLD', taluks: ['Doddaballapura', 'Devanahalli', 'Hosakote', 'Nelamangala'] },
  { name: 'Ramanagara', code: 'RMN', taluks: ['Ramanagara', 'Channapatna', 'Kanakapura', 'Magadi', 'Kunigal'] },
  { name: 'Bidar', code: 'BDR', taluks: ['Bidar', 'Basavakalyan', 'Bhalki', 'Aurad', 'Humnabad', 'Chitguppa', 'Kamalnagar'] },
  { name: 'Chamarajanagara', code: 'CMJ', taluks: ['Chamarajanagara', 'Gundlupet', 'Kollegal', 'Hanur', 'Yelandur'] },
  { name: 'Chikkaballapura', code: 'CKB', taluks: ['Chikkaballapura', 'Bagepalli', 'Chintamani', 'Gauribidanur', 'Gudibanda', 'Sidlaghatta'] },
  { name: 'Chikkamagaluru', code: 'CKM', taluks: ['Chikkamagaluru', 'Kadur', 'Koppa', 'Mudigere', 'Kalasa', 'Narasimharajapura', 'Sringeri', 'Tarikere', 'Ajjampura'] },
  { name: 'Chitradurga', code: 'CTD', taluks: ['Chitradurga', 'Challakere', 'Hiriyur', 'Holalkere', 'Hosadurga', 'Molakalmuru'] },
  { name: 'Dakshina Kannada', code: 'DKK', taluks: ['Mangaluru', 'Bantwal', 'Beltangadi', 'Moodabidri', 'Kadaba', 'Puttur', 'Sulya'] },
  { name: 'Davanagere', code: 'DVG', taluks: ['Davanagere', 'Channagiri', 'Harihar', 'Honnali', 'Jagalur', 'Nyamati'] },
  { name: 'Dharwad', code: 'DWD', taluks: ['Dharwad', 'Hubballi', 'Kalghatgi', 'Kundgol', 'Navalgund', 'Annigeri', 'Alnavar'] },
  { name: 'Gadag', code: 'GDG', taluks: ['Gadag-Betageri', 'Mundargi', 'Nargund', 'Gajendragad', 'Lakshmeshwar', 'Ron', 'Shirhatti'] },
  { name: 'Hassan', code: 'HSN', taluks: ['Hassan', 'Alur', 'Arkalgud', 'Arsikere', 'Belur', 'Channarayapattana', 'Holenarsipur', 'Sakleshpur'] },
  { name: 'Haveri', code: 'HVR', taluks: ['Haveri', 'Byadgi', 'Hangal', 'Hirekerur', 'Ranebennur', 'Rattihalli', 'Savanur', 'Shiggaon'] },
  { name: 'Kalaburagi', code: 'KLB', taluks: ['Kalaburagi', 'Afzalpur', 'Aland', 'Chincholi', 'Chittapur', 'Jevargi', 'Sedam', 'Shahabad', 'Kamalapur', 'Yedrami'] },
  { name: 'Kodagu', code: 'KDG', taluks: ['Madikeri', 'Kushalanagar', 'Virajpet', 'Somvarpet', 'Ponnampet'] },
  { name: 'Kolar', code: 'KLR', taluks: ['Kolar', 'Bangarapet', 'Kolar Gold Fields', 'Malur', 'Mulbagal', 'Srinivaspur'] },
  { name: 'Koppal', code: 'KPL', taluks: ['Koppal', 'Gangavati', 'Kanakagiri', 'Kushtagi', 'Yelbarga', 'Karatagi'] },
  { name: 'Mandya', code: 'MDY', taluks: ['Mandya', 'Krishnarajpet', 'Maddur', 'Malavalli', 'Nagamangala', 'Pandavapura', 'Srirangapattana'] },
  { name: 'Mysuru', code: 'MYS', taluks: ['Mysuru', 'Heggadadevana Kote', 'Hunsur', 'Krishnarajanagara', 'Nanjangud', 'Periyapatna', 'Saragur', 'T. Narsipur'] },
  { name: 'Raichur', code: 'RCH', taluks: ['Raichur', 'Devadurga', 'Lingsugur', 'Manvi', 'Maski', 'Sindhanur', 'Sirwar'] },
  { name: 'Shivamogga', code: 'SHV', taluks: ['Shivamogga', 'Bhadravati', 'Hosanagara', 'Sagar', 'Shikaripura', 'Sorab', 'Tirthahalli'] },
  { name: 'Tumakuru', code: 'TMK', taluks: ['Tumakuru', 'Chiknayakanhalli', 'Gubbi', 'Koratagere', 'Kunigal', 'Madhugiri', 'Pavagada', 'Sira', 'Tiptur', 'Turuvekere'] },
  { name: 'Udupi', code: 'UDP', taluks: ['Udupi', 'Brahmavara', 'Karkala', 'Kapu', 'Kundapura', 'Hebri', 'Byndoor'] },
  { name: 'Uttara Kannada', code: 'UTK', taluks: ['Karwar', 'Ankola', 'Bhatkal', 'Dandeli', 'Haliyal', 'Honnavar', 'Joida', 'Kumta', 'Mundgod', 'Siddapur', 'Sirsi', 'Yellapur'] },
  { name: 'Vijayapura', code: 'VJP', taluks: ['Vijayapura', 'Indi', 'Muddebihal', 'Basavana Bagevadi', 'Sindgi', 'Chadachan', 'Talikote', 'Kolhar'] },
  { name: 'Vijayanagara', code: 'VJN', taluks: ['Hospete', 'Harapanahalli', 'Hagaribommanahalli', 'Hoovina Hadagali', 'Kottur', 'Kudligi'] },
  { name: 'Yadgir', code: 'YDG', taluks: ['Yadgir', 'Gurumitkal', 'Hunasagi', 'Shahapur', 'Shorapur', 'Vadagera'] }
];

function talukaCode(districtCode, talukaName, usedCodes) {
  let base = talukaName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
  let code = `${districtCode}-${base}`;
  let suffix = 1;
  while (usedCodes.has(code)) {
    code = `${districtCode}-${base}${suffix}`;
    suffix += 1;
  }
  usedCodes.add(code);
  return code;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const karnataka = await State.findOne({ code: 'KA' });
  if (!karnataka) {
    throw new Error('Karnataka state (code "KA") not found. Create it first before running this seed.');
  }

  let districtCount = 0;
  let talukaCount = 0;

  for (const districtData of KARNATAKA_DATA) {
    const district = await District.findOneAndUpdate(
      { stateId: karnataka._id, name: districtData.name },
      {
        $setOnInsert: {
          name: districtData.name,
          code: districtData.code,
          stateId: karnataka._id,
          isActive: true
        }
      },
      { upsert: true, new: true }
    );
    districtCount += 1;

    const usedCodes = new Set();
    for (const talukaName of districtData.taluks) {
      const code = talukaCode(districtData.code, talukaName, usedCodes);
      await Taluka.findOneAndUpdate(
        { districtId: district._id, name: talukaName },
        {
          $setOnInsert: {
            name: talukaName,
            code,
            districtId: district._id,
            isActive: true
          }
        },
        { upsert: true, new: true }
      );
      talukaCount += 1;
    }

    console.log(`✔ ${districtData.name} (${districtData.taluks.length} taluks)`);
  }

  console.log(`\nDone. Upserted ${districtCount} districts and ${talukaCount} taluks under Karnataka.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});