const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Region name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    code: {
      type: String,
      required: [true, 'Region code is required'],
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 10
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: [true, 'Division ID is required'],
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

// Compound unique index ensuring Region name uniqueness per Division
regionSchema.index({ divisionId: 1, name: 1 }, { unique: true });

const Region = mongoose.model('Region', regionSchema);

module.exports = Region;