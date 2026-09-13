const mongoose = require('mongoose');

const villageCitySchema = new mongoose.Schema(
  {
    villageCityName: {
      type: String,
      required: [true, 'Village/City name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Village/City code is required'],
      uppercase: true,
      trim: true
    },
    talukaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taluka',
      required: [true, 'Taluka ID is required'],
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['VILLAGE', 'CITY'],
        message: 'Invalid classification type: {VALUE}'
      },
      default: 'VILLAGE'
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

// Compound unique index ensuring village/city name uniqueness per Taluka
villageCitySchema.index({ talukaId: 1, villageCityName: 1 }, { unique: true });

const VillageCity = mongoose.model('VillageCity', villageCitySchema);

module.exports = VillageCity;