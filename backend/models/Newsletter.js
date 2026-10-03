const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/, 'Please provide a valid email']
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Newsletter', newsletterSchema, 'newsletters');
