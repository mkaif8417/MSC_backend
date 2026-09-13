const mongoose = require('mongoose');

const areaLocalitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Area/Locality name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Area/Locality code is required'],
      uppercase: true,
      trim: true
    },
    villageCityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VillageCity',
      required: [true, 'Village/City ID is required'],
      index: true
    },
    pincode: {
      type: String,
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

// Compound unique index ensuring Area/Locality name uniqueness per VillageCity
areaLocalitySchema.index({ villageCityId: 1, name: 1 }, { unique: true });

const AreaLocality = mongoose.model('AreaLocality', areaLocalitySchema);

module.exports = AreaLocality;