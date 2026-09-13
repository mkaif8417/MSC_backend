const mongoose = require('mongoose');
const { Schema } = mongoose;

const coordinatorAttendanceSchema = new Schema(
  {
    coordinatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Coordinator',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    loginTime: {
      type: String, // HH:mm, 24hr
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'loginTime must be in HH:mm format']
    },
    logoutTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'logoutTime must be in HH:mm format']
    },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      required: true
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 300
    }
  },
  {
    timestamps: true
  }
);

// One attendance record per coordinator per day
coordinatorAttendanceSchema.index({ coordinatorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CoordinatorAttendance', coordinatorAttendanceSchema);