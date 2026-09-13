const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLE_LIST, ROLES } = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Never return passwordHash in normal queries
    },
    role: {
      type: String,
      enum: {
        values: ROLE_LIST,
        message: 'Invalid user role: {VALUE}'
      },
      required: [true, 'Role is required'],
      default: ROLES.DATA_ENTRY_OPERATOR,
      index: true
    },
    scope: {
      type: {
        type: String,
        enum: ['GLOBAL', 'DISTRICT', 'CENTER'],
        default: 'CENTER'
      },
      districtId: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },
      studyCenterId: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      }
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
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  
  // If passwordHash holds plain password, hash it
  if (!this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  
  next();
});

// Compare password candidate
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash password directly
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
