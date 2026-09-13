const mongoose = require('mongoose');
const { Schema } = mongoose;

const teacherSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid Indian mobile number']
    },
    qualification: { type: String, trim: true, maxlength: 150 },
    subjects: [{ type: String, trim: true }],
    areaLocalityId: { type: Schema.Types.ObjectId, ref: 'AreaLocality', required: true },
    studyCenterId: { type: Schema.Types.ObjectId, ref: 'StudyCenter', required: true },
    joiningDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  { timestamps: true }
);

teacherSchema.index({ studyCenterId: 1 });
teacherSchema.index({ areaLocalityId: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);