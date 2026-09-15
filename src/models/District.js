const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'District code is required'],
      uppercase: true,
      trim: true
    },
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: [true, 'State ID is required'],
      index: true
    },
    regionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      default: null,
      index: true
      // Optional for now, same reasoning as before — once
      // seedKarnatakaRegions.js (Step 4) has run and every district has
      // a regionId, add required: [true, 'Region ID is required'] here.
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

// Compound unique index ensuring district name uniqueness per State
districtSchema.index({ stateId: 1, name: 1 }, { unique: true });

const District = mongoose.model('District', districtSchema);

module.exports = District;