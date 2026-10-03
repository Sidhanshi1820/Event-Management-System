const mongoose = require('mongoose');

const eventTypeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [80, 'Title cannot exceed 80 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [40, 'Category cannot exceed 40 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    default: '🎉',
    maxlength: [8, 'Icon cannot exceed 8 characters']
  },
  rating: {
    type: Number,
    default: 4.8,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviews: {
    type: Number,
    default: 0,
    min: [0, 'Reviews cannot be negative']
  },
  startingPrice: {
    type: Number,
    default: 0,
    min: [0, 'Starting price cannot be negative']
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('EventType', eventTypeSchema);
