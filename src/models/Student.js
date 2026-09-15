const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true
    },
    fatherGuardianName: {
      type: String,
      required: [true, 'Father/Guardian name is required'],
      trim: true
    },
    mobileNumber: {
      type: String,
      trim: true
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative']
    },
    studyCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyCenter',
      required: [true, 'Study Center ID is required'],
      index: true
    },
    villageLocality: {
      type: String,
      trim: true
    },
    schoolCollegeName: {
      type: String,
      trim: true
    },
    currentEducationalLevel: {
      type: String,
      trim: true
    },
    class: {
      type: String,
      enum: ['8th', '9th', '10th', '11th', '12th', 'Degree'],
      required: [true, 'Class is required']
    },
    // Radio button choice — ONLY applicable for 8th/9th/10th (AICU or Self Study).
    // Not applicable/required for 11th/12th/Degree.
    courseType: {
      type: String,
      enum: ['AICU', 'Self Study'],
      default: undefined
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

// Enforce class-driven courseType rules at the model layer (defense-in-depth alongside Joi)
studentSchema.pre('validate', function preValidate(next) {
  const lowerGroup = ['8th', '9th', '10th'];
  const upperGroup = ['11th', '12th', 'Degree'];

  if (lowerGroup.includes(this.class)) {
    if (!['AICU', 'Self Study'].includes(this.courseType)) {
      return next(new Error('courseType must be AICU or Self Study for 8th/9th/10th'));
    }
  } else if (upperGroup.includes(this.class)) {
    // No courseType selection allowed/required for 11th, 12th, Degree
    if (this.courseType !== undefined) {
      this.courseType = undefined;
    }
  }
  return next();
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;