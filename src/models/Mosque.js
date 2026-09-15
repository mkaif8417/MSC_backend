const mongoose = require('mongoose');

const facilityItemSchema = new mongoose.Schema(
  {
    available: { type: Boolean, default: false },
    condition: {
      type: String,
      enum: ['Good', 'Needs Repair', 'Not Available'],
      default: 'Not Available'
    }
  },
  { _id: false }
);

const staffMemberSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    contactNumber: { type: String, trim: true }
  },
  { _id: false }
);

const unemployedPersonSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [120, 'Age is not valid']
    },
    contactNumber: { type: String, required: [true, 'Contact number is required'], trim: true }
  },
  { timestamps: true }
);

const mosqueSchema = new mongoose.Schema(
  {
    // --- Core identity ---
    code: {
      type: String,
      required: [true, 'Mosque code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      index: true
    },
    name: { type: String, required: [true, 'Mosque name is required'], trim: true },
    address: { type: String, required: [true, 'Address is required'], trim: true },
    pincode: { type: String, required: [true, 'Pincode is required'], trim: true },
    areaLocalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AreaLocality',
      required: [true, 'Area/Locality ID is required'],
      index: true
    },
    latitude: { type: Number, min: [-90, 'Latitude must be between -90 and 90'], max: [90, 'Latitude must be between -90 and 90'] },
    longitude: { type: Number, min: [-180, 'Longitude must be between -180 and 180'], max: [180, 'Longitude must be between -180 and 180'] },
    locationPin: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] } // [longitude, latitude]
    },
    googleMapsUrl: { type: String, trim: true },

    // --- Mosque-level details ---
    capacity: { type: Number, min: [0, 'Capacity cannot be negative'] },
    inchargeName: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    ledBy: {
      type: String,
      enum: ['Govt Support', 'Masjid Led', 'Community Led']
    },

    // --- Fixed mosque staff roles ---
    masjidStaff: {
      khateeb: { type: staffMemberSchema, default: () => ({}) },
      muazzin: { type: staffMemberSchema, default: () => ({}) },
      assistantMuazzin: { type: staffMemberSchema, default: () => ({}) },
      khadim: { type: staffMemberSchema, default: () => ({}) }
    },

    // --- Nearby unemployed graduates / dropouts tracked by this mosque ---
    nearestUnemployedGraduatesAndDropouts: {
      type: [unemployedPersonSchema],
      default: []
    },

    // --- Study Center details (every mosque IS a study center, so these
    //     live directly on Mosque instead of a separate collection) ---
    studyCenterName: { type: String, trim: true },
    studyCenterStartDate: { type: Date },
    studyCenterTablesCount: { type: Number, min: [0, 'Tables count cannot be negative'], default: 0 },
    studyCenterChairsCount: { type: Number, min: [0, 'Chairs count cannot be negative'], default: 0 },
    studyCenterCapacity: { type: Number, min: [0, 'Seating capacity cannot be negative'], default: 0 },
    studyCenterRoomsCount: { type: Number, min: [0, 'Rooms count cannot be negative'], default: 0 },
    studyCenterInchargeName: { type: String, trim: true },
    studyCenterContactNumber: { type: String, trim: true },
    studyCenterFacilities: {
      electricity: { type: facilityItemSchema, default: () => ({}) },
      fansAc: { type: facilityItemSchema, default: () => ({}) },
      lights: { type: facilityItemSchema, default: () => ({}) },
      internetWifi: { type: facilityItemSchema, default: () => ({}) },
      drinkingWater: { type: facilityItemSchema, default: () => ({}) },
      toilets: { type: facilityItemSchema, default: () => ({}) },
      libraryBooks: { type: facilityItemSchema, default: () => ({}) }
    },
    studyCenterGrade: {
      type: String,
      enum: ['C', 'C+', 'B', 'B+', 'B++', 'A', 'A++'],
      trim: true
    },

    isActive: { type: Boolean, default: true, index: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound unique index ensuring Mosque name uniqueness per AreaLocality
mosqueSchema.index({ areaLocalityId: 1, name: 1 }, { unique: true });

// 2dsphere index for location queries if locationPin is present
mosqueSchema.index({ locationPin: '2dsphere' });

const Mosque = mongoose.model('Mosque', mosqueSchema);

module.exports = Mosque;