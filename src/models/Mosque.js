const mongoose = require('mongoose');

const mosqueSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mosque code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Mosque name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true
    },
    areaLocalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AreaLocality',
      required: [true, 'Area/Locality ID is required'],
      index: true
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    locationPin: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    },
    googleMapsUrl: {
      type: String,
      trim: true
    },
    capacity: {
      type: Number,
      min: [0, 'Capacity cannot be negative']
    },
    inchargeName: {
      type: String,
      trim: true
    },
    contactNumber: {
      type: String,
      trim: true
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

// Compound unique index ensuring Mosque name uniqueness per AreaLocality
mosqueSchema.index({ areaLocalityId: 1, name: 1 }, { unique: true });

// 2dsphere index for location queries if locationPin is present
mosqueSchema.index({ locationPin: '2dsphere' });

const Mosque = mongoose.model('Mosque', mosqueSchema);

module.exports = Mosque;