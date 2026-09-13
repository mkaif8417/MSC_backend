const mongoose = require('mongoose');
const { Schema } = mongoose;

const teacherAttendanceSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    date: { type: Date, required: true },
    loginTime: { type: String }, // 'HH:mm'
    logoutTime: { type: String },
    status: { type: String, enum: ['Present', 'Absent'], required: true },
    remarks: { type: String, trim: true, maxlength: 300 }
  },
  { timestamps: true }
);

teacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TeacherAttendance', teacherAttendanceSchema);