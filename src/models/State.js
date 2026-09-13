const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'State name is required'],
      trim: true,
      index: true
    },
    code: {
      type: String,
      required: [true, 'State code is required'],
      unique: true,
      uppercase: true,
      trim: true,
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

const State = mongoose.model('State', stateSchema);

module.exports = State;
