const mongoose = require('mongoose');
const { Schema } = mongoose;

const teacherDailyReportSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    date: { type: Date, required: true },
    reportText: { type: String, required: true, trim: true, maxlength: 2000 },
    issuesReported: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

teacherDailyReportSchema.index({ teacherId: 1, date: 1 });

module.exports = mongoose.model('TeacherDailyReport', teacherDailyReportSchema);