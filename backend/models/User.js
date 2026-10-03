const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [60, 'Full name cannot exceed 60 characters'],
    validate: {
      validator: function(value) {
        return !/[<>]/.test(value);
      },
      message: 'Full name cannot contain < or > characters'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/, 'Please provide a valid email']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    minlength: [2, 'Company name must be at least 2 characters'],
    maxlength: [120, 'Company name cannot exceed 120 characters'],
    validate: {
      validator: function(value) {
        return !/[<>]/.test(value);
      },
      message: 'Company name cannot contain < or > characters'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [72, 'Password cannot exceed 72 characters'],
    select: false // Don't return password by default
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to add login history
userSchema.methods.addLoginHistory = function(ipAddress, userAgent) {
  if (!this.loginHistory) {
    this.loginHistory = [];
  }
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent
  });
  // Keep only last 10 login records
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(-10);
  }
};

module.exports = mongoose.model('User', userSchema);
