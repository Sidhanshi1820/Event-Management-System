const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title must not exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [5000, 'Description must not exceed 5000 characters']
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    enum: [
      'conference',
      'workshop',
      'seminar',
      'webinar',
      'meetup',
      'networking',
      'training',
      'exhibition',
      'festival',
      'concert',
      'sports',
      'charity',
      'other'
    ]
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags) {
        return tags.length <= 10;
      },
      message: 'Maximum 10 tags allowed'
    }
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer ID is required']
  },
  organizerName: {
    type: String,
    required: [true, 'Organizer name is required'],
    trim: true
  },
  organizerEmail: {
    type: String,
    required: [true, 'Organizer email is required'],
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  
  // Date and time
  dates: {
    startDate: {
      type: Date,
      required: [true, 'Event start date is required'],
      validate: {
        validator: function(value) {
          // Allow past dates for draft events, but published events should be in future
          if (this.status === 'published') {
            return value > new Date();
          }
          return true;
        },
        message: 'Published event start date must be in the future'
      }
    },
    endDate: {
      type: Date,
      required: [true, 'Event end date is required'],
      validate: {
        validator: function(value) {
          return value > this.dates.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      default: 'UTC'
    }
  },
  
  // Location
  location: {
    locationType: {
      type: String,
      required: [true, 'Location type is required'],
      enum: ['physical', 'virtual', 'hybrid']
    },
    venue: {
      name: {
        type: String,
        required: function() {
          return this.location.locationType === 'physical' || this.location.locationType === 'hybrid';
        }
      },
      address: {
        type: String,
        required: function() {
          return this.location.locationType === 'physical' || this.location.locationType === 'hybrid';
        }
      },
      city: {
        type: String,
        required: function() {
          return this.location.locationType === 'physical' || this.location.locationType === 'hybrid';
        }
      },
      state: {
        type: String,
        required: function() {
          return this.location.locationType === 'physical' || this.location.locationType === 'hybrid';
        }
      },
      country: {
        type: String,
        required: function() {
          return this.location.locationType === 'physical' || this.location.locationType === 'hybrid';
        }
      },
      zipCode: {
        type: String,
        required: function() {
          return this.location.locationType === 'physical' || this.location.locationType === 'hybrid';
        }
      },
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180
        }
      }
    },
    virtualLink: {
      type: String,
      required: function() {
        return this.location.locationType === 'virtual' || this.location.locationType === 'hybrid';
      },
      validate: {
        validator: function(value) {
          if (!value) return true;
          // Basic URL validation
          return /^https?:\/\/.+/.test(value);
        },
        message: 'Virtual link must be a valid URL'
      }
    }
  },
  
  // Capacity and registration
  capacity: {
    type: Number,
    required: [true, 'Event capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Capacity must be an integer'
    }
  },
  registrationStartDate: {
    type: Date,
    required: [true, 'Registration start date is required']
  },
  registrationEndDate: {
    type: Date,
    required: [true, 'Registration end date is required'],
    validate: {
      validator: function(value) {
        return value <= this.dates.startDate;
      },
      message: 'Registration end date must be before or equal to event start date'
    }
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  
  // Visibility and status
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  visibility: {
    type: String,
    required: true,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Media
  media: {
    coverImage: {
      type: String,
      default: null,
      validate: {
        validator: function(value) {
          if (!value) return true;
          // Basic URL validation for image
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value);
        },
        message: 'Cover image must be a valid image URL'
      }
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(images) {
          return images.length <= 10;
        },
        message: 'Maximum 10 images allowed'
      }
    }
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: null,
    required: function() {
      return this.status === 'cancelled';
    }
  }
});

// Indexes for frequently queried fields
eventSchema.index({ organizerId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'dates.startDate': 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ featured: 1 });
eventSchema.index({ visibility: 1 });
// Compound indexes for common query patterns
eventSchema.index({ status: 1, 'dates.startDate': 1 });
eventSchema.index({ organizerId: 1, status: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ featured: 1, status: 1, 'dates.startDate': 1 });
// Text index for search functionality
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Update the updatedAt timestamp before saving
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Set publishedAt timestamp when status changes to published
eventSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Set cancelledAt timestamp when status changes to cancelled
eventSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  next();
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.dates.startDate > new Date() && this.status === 'published';
});

// Virtual for checking if event is ongoing
eventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.dates.startDate <= now && this.dates.endDate >= now && this.status === 'published';
});

// Virtual for checking if event is past
eventSchema.virtual('isPast').get(function() {
  return this.dates.endDate < new Date();
});

// Virtual for checking if registration is open
eventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return (
    this.status === 'published' &&
    this.registrationStartDate <= now &&
    this.registrationEndDate >= now
  );
});

// Method to check if event can be published
eventSchema.methods.canPublish = function() {
  // Event must be in draft status
  if (this.status !== 'draft') {
    return { valid: false, reason: 'Event must be in draft status to publish' };
  }
  
  // Start date must be in the future
  if (this.dates.startDate <= new Date()) {
    return { valid: false, reason: 'Event start date must be in the future' };
  }
  
  // Must have all required fields
  if (!this.title || !this.description || !this.category) {
    return { valid: false, reason: 'Missing required fields' };
  }
  
  return { valid: true };
};

// Method to check if event can be cancelled
eventSchema.methods.canCancel = function() {
  // Cannot cancel already cancelled or completed events
  if (this.status === 'cancelled' || this.status === 'completed') {
    return { valid: false, reason: 'Event is already cancelled or completed' };
  }
  
  return { valid: true };
};

// Method to publish event
eventSchema.methods.publish = function() {
  const canPublish = this.canPublish();
  if (!canPublish.valid) {
    throw new Error(canPublish.reason);
  }
  
  this.status = 'published';
  this.publishedAt = new Date();
};

// Method to cancel event
eventSchema.methods.cancel = function(reason) {
  const canCancel = this.canCancel();
  if (!canCancel.valid) {
    throw new Error(canCancel.reason);
  }
  
  if (!reason) {
    throw new Error('Cancellation reason is required');
  }
  
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
};

// Method to complete event
eventSchema.methods.complete = function() {
  if (this.status !== 'published') {
    throw new Error('Only published events can be marked as completed');
  }
  
  if (this.dates.endDate > new Date()) {
    throw new Error('Event has not ended yet');
  }
  
  this.status = 'completed';
};

// Ensure virtuals are included in JSON output
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
