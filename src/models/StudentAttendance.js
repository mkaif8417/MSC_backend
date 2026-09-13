const mongoose = require('mongoose');

const studentAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT'],
      required: true
    },
    loginTime: {
      type: String,
      trim: true,
      default: null
    },
    logoutTime: {
      type: String,
      trim: true,
      default: null
    },
    attendanceType: {
      type: String,
      enum: ['REGULAR', 'IRREGULAR'],
      default: 'REGULAR'
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// One record per student, per day — now that there's no activity split.
studentAttendanceSchema.index(
  { studentId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema);