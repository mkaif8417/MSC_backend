const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required']
    },
    guardianName: {
      type: String,
      required: [true, 'Guardian name is required'],
      trim: true
    },
    relationToStudent: {
      type: String,
      trim: true
    },
    mobileNumber: {
      type: String,
      trim: true
    },
    alternateMobileNumber: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
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

// 1-to-1: one Guardian record per Student
guardianSchema.index({ studentId: 1 }, { unique: true });

const Guardian = mongoose.model('Guardian', guardianSchema);

module.exports = Guardian;