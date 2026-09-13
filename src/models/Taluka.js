const mongoose = require('mongoose');

const talukaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Taluka name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Taluka code is required'],
      uppercase: true,
      trim: true
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District ID is required'],
      index: true
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

// Compound unique index ensuring taluka name uniqueness per District
talukaSchema.index({ districtId: 1, name: 1 }, { unique: true });

const Taluka = mongoose.model('Taluka', talukaSchema);

module.exports = Taluka;
