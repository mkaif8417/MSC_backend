const mongoose = require('mongoose');

const SUBJECTS = ['Maths', 'Urdu', 'English'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_STATUS = ['Regular', 'Absent', 'Holiday', 'Program', 'WeeklyOff'];

const subjectEntrySchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      enum: SUBJECTS,
      required: true
    },
    hw: { type: Number, min: 0, default: null },       // Home Work
    cw: { type: Number, min: 0, default: null },       // Class Work
    grade: { type: String, trim: true, default: null }, // GD
    pageNumber: { type: Number, min: 1, default: null }, // PG
    topic: { type: String, trim: true, default: null }  // TP — auto-filled from Topic collection, not client-editable
  },
  { _id: false }
);

const dailyEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    day: { type: String, enum: DAYS, required: true },
    status: { type: String, enum: DAY_STATUS, default: 'Regular' },
    note: { type: String, trim: true, default: null }, // e.g. "Independence Day", "Program"
    subjects: {
      type: [subjectEntrySchema],
      default: []
    }
  },
  { _id: false }
);

const weeklyResultSchema = new mongoose.Schema(
  {
    subject: { type: String, enum: SUBJECTS, required: true },
    totalMarks: { type: Number, min: 0, default: 0 },
    obtainedMarks: { type: Number, min: 0, default: 0 },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    grade: { type: String, trim: true, default: null }
  },
  { _id: false }
);

const academicSheetSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true
    },
    studyCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyCenter',
      required: [true, 'Study Center ID is required'],
      index: true
    },
    class: {
      type: String,
      enum: ['8th', '9th', '10th'],
      required: [true, 'Class is required']
    },
    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },
    dailyEntries: {
      type: [dailyEntrySchema],
      default: []
    },
    weeklyResult: {
      type: [weeklyResultSchema],
      default: () => SUBJECTS.map((subject) => ({ subject, totalMarks: 0, obtainedMarks: 0, percentage: 0, grade: null }))
    },
    workingDays: { type: Number, min: 0, default: 0 },
    attendance: { type: Number, min: 0, default: 0 },
    overallTotal: { type: Number, min: 0, default: 0 },
    overallObtained: { type: Number, min: 0, default: 0 },
    overallPercentage: { type: Number, min: 0, max: 100, default: 0 },
    overallGrade: { type: String, trim: true, default: null },
    filledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'filledBy (teacher) is required']
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

// One sheet per student per week
academicSheetSchema.index({ studentId: 1, weekStartDate: 1 }, { unique: true });

// Auto-compute percentage/grade per subject and the overall row before saving
academicSheetSchema.pre('validate', function preValidate(next) {
  const gradeFromPercent = (pct) => {
    if (pct >= 90) return 'A+';
    if (pct >= 75) return 'A';
    if (pct >= 60) return 'B+';
    if (pct >= 45) return 'B';
    if (pct >= 33) return 'C';
    return 'D';
  };

  let overallTotal = 0;
  let overallObtained = 0;

  this.weeklyResult.forEach((row) => {
    row.percentage = row.totalMarks > 0 ? Math.round((row.obtainedMarks / row.totalMarks) * 100) : 0;
    row.grade = gradeFromPercent(row.percentage);
    overallTotal += row.totalMarks;
    overallObtained += row.obtainedMarks;
  });

  this.overallTotal = overallTotal;
  this.overallObtained = overallObtained;
  this.overallPercentage = overallTotal > 0 ? Math.round((overallObtained / overallTotal) * 100) : 0;
  this.overallGrade = gradeFromPercent(this.overallPercentage);

  next();
});

const AcademicSheet = mongoose.model('AcademicSheet', academicSheetSchema);

module.exports = AcademicSheet;
module.exports.SUBJECTS = SUBJECTS;
module.exports.DAYS = DAYS;
module.exports.DAY_STATUS = DAY_STATUS;