const mongoose = require('mongoose');

const facilityItemSchema = new mongoose.Schema(
  {
    available: {
      type: Boolean,
      default: false
    },
    condition: {
      type: String,
      enum: ['Good', 'Needs Repair', 'Not Available'],
      default: 'Not Available'
    }
  },
  { _id: false }
);

const studyCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    mosqueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mosque',
      required: [true, 'Mosque ID is required']
    },
    startDate: {
      type: Date
    },
    tablesCount: {
      type: Number,
      min: [0, 'Tables count cannot be negative'],
      default: 0
    },
    chairsCount: {
      type: Number,
      min: [0, 'Chairs count cannot be negative'],
      default: 0
    },
    capacity: {
      type: Number,
      min: [0, 'Seating capacity cannot be negative'],
      default: 0
    },
    roomsCount: {
      type: Number,
      min: [0, 'Rooms count cannot be negative'],
      default: 0
    },
    inchargeName: {
      type: String,
      trim: true
    },
    contactNumber: {
      type: String,
      trim: true
    },
    facilities: {
      electricity: { type: facilityItemSchema, default: () => ({}) },
      fansAc: { type: facilityItemSchema, default: () => ({}) },
      lights: { type: facilityItemSchema, default: () => ({}) },
      internetWifi: { type: facilityItemSchema, default: () => ({}) },
      drinkingWater: { type: facilityItemSchema, default: () => ({}) },
      toilets: { type: facilityItemSchema, default: () => ({}) },
      libraryBooks: { type: facilityItemSchema, default: () => ({}) }
    },
    grade: {
      type: String,
      enum: ['C', 'C+', 'B', 'B+', 'B++', 'A', 'A++'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
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

// CRITICAL 1-TO-1 DATABASE CONSTRAINT: One Mosque can have at most one Study Center
studyCenterSchema.index({ mosqueId: 1 }, { unique: true });

const StudyCenter = mongoose.model('StudyCenter', studyCenterSchema);

module.exports = StudyCenter;
