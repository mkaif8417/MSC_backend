const mongoose = require('mongoose');
const { Schema } = mongoose;

const coordinatorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian number']
    },
    qualification: {
      type: String,
      trim: true,
      maxlength: 150
    },
    subjects: {
      type: [String],
      default: []
    },
    areaLocalityId: {
      type: Schema.Types.ObjectId,
      ref: 'AreaLocality',
      required: true
    },
    studyCenterId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyCenter',
      required: true
    },
    joiningDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

coordinatorSchema.index({ studyCenterId: 1, status: 1 });
coordinatorSchema.index({ areaLocalityId: 1 });

module.exports = mongoose.model('Coordinator', coordinatorSchema);