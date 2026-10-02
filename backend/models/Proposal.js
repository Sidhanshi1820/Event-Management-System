const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [60, 'Full name must not exceed 60 characters'],
    validate: {
      validator: function(value) {
        // Reject angle brackets so the value can never break out of rendered HTML
        return !/[<>]/.test(value);
      },
      message: 'Full name must not contain < or >'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/, 'Please provide a valid email']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    minlength: [2, 'Company name must be at least 2 characters'],
    maxlength: [120, 'Company name must not exceed 120 characters'],
    validate: {
      validator: function(value) {
        // Reject angle brackets so the value can never break out of rendered HTML
        return !/[<>]/.test(value);
      },
      message: 'Company name must not contain < or >'
    }
  },
  phone: {
    type: String,
    default: null,
    maxlength: [20, 'Phone number must not exceed 20 characters']
  },
  event_type: {
    type: String,
    required: [true, 'Event type is required'],
    trim: true,
    maxlength: [60, 'Event type must not exceed 60 characters']
  },
  event_date: {
    type: Date,
    default: null
  },
  guests: {
    type: Number,
    default: null,
    validate: {
      validator: function(value) {
        if (value === null || value === undefined) return true;
        // Guests must be a whole number of at least 1 person
        return Number.isInteger(value) && value >= 1;
      },
      message: 'Number of guests must be an integer of at least 1'
    }
  },
  message: {
    type: String,
    default: null,
    maxlength: [1000, 'Message must not exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for looking proposals up by email
proposalSchema.index({ email: 1 });

// Update the updatedAt timestamp before saving
proposalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Proposal', proposalSchema);