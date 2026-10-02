const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  name: {
    type: String,
    required: [true, 'Ticket type name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name must not exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must not exceed 500 characters'],
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be non-negative'],
    validate: {
      validator: function(value) {
        // Ensure price has at most 2 decimal places
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      },
      message: 'Price must have at most 2 decimal places'
    }
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'CNY'],
    validate: {
      validator: function(value) {
        // ISO 4217 currency code validation (3 letters)
        return /^[A-Z]{3}$/.test(value);
      },
      message: 'Currency must be a valid ISO 4217 code'
    }
  },
  
  // Availability
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  quantitySold: {
    type: Number,
    default: 0,
    min: [0, 'Quantity sold cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity sold must be an integer'
    }
  },
  quantityReserved: {
    type: Number,
    default: 0,
    min: [0, 'Quantity reserved cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity reserved must be an integer'
    }
  },
  
  // Sales window
  salesStartDate: {
    type: Date,
    required: [true, 'Sales start date is required']
  },
  salesEndDate: {
    type: Date,
    required: [true, 'Sales end date is required'],
    validate: {
      validator: function(value) {
        return value > this.salesStartDate;
      },
      message: 'Sales end date must be after sales start date'
    }
  },
  
  // Restrictions
  minQuantityPerOrder: {
    type: Number,
    default: 1,
    min: [1, 'Minimum quantity per order must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Minimum quantity per order must be an integer'
    }
  },
  maxQuantityPerOrder: {
    type: Number,
    required: [true, 'Maximum quantity per order is required'],
    min: [1, 'Maximum quantity per order must be at least 1'],
    validate: [
      {
        validator: Number.isInteger,
        message: 'Maximum quantity per order must be an integer'
      },
      {
        validator: function(value) {
          return value >= this.minQuantityPerOrder;
        },
        message: 'Maximum quantity per order must be greater than or equal to minimum quantity'
      }
    ]
  },
  maxQuantityPerUser: {
    type: Number,
    required: [true, 'Maximum quantity per user is required'],
    min: [1, 'Maximum quantity per user must be at least 1'],
    validate: [
      {
        validator: Number.isInteger,
        message: 'Maximum quantity per user must be an integer'
      },
      {
        validator: function(value) {
          return value <= this.quantity;
        },
        message: 'Maximum quantity per user must not exceed total quantity'
      }
    ]
  },
  
  // Features
  isRefundable: {
    type: Boolean,
    default: true
  },
  refundPolicy: {
    type: String,
    trim: true,
    maxlength: [1000, 'Refund policy must not exceed 1000 characters'],
    default: 'Full refund available up to 7 days before the event.'
  },
  includesFeatures: {
    type: [String],
    default: [],
    validate: {
      validator: function(features) {
        return features.length <= 20;
      },
      message: 'Maximum 20 features allowed'
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
  isActive: {
    type: Boolean,
    default: true
  }
});

// Indexes for frequently queried fields
ticketTypeSchema.index({ eventId: 1 });
ticketTypeSchema.index({ isActive: 1 });
ticketTypeSchema.index({ salesStartDate: 1 });
ticketTypeSchema.index({ salesEndDate: 1 });
// Compound indexes for common query patterns
ticketTypeSchema.index({ eventId: 1, isActive: 1 });
ticketTypeSchema.index({ eventId: 1, salesStartDate: 1, salesEndDate: 1 });

// Update the updatedAt timestamp before saving
ticketTypeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Validate that sold + reserved doesn't exceed total quantity
ticketTypeSchema.pre('save', function(next) {
  if (this.quantitySold + this.quantityReserved > this.quantity) {
    return next(new Error('Sold and reserved quantities cannot exceed total quantity'));
  }
  next();
});

// Virtual for quantity available
ticketTypeSchema.virtual('quantityAvailable').get(function() {
  return this.quantity - this.quantitySold - this.quantityReserved;
});

// Virtual for checking if tickets are available
ticketTypeSchema.virtual('hasAvailability').get(function() {
  return this.quantityAvailable > 0 && this.isActive;
});

// Virtual for checking if sales are open
ticketTypeSchema.virtual('isSalesOpen').get(function() {
  const now = new Date();
  return (
    this.isActive &&
    this.salesStartDate <= now &&
    this.salesEndDate >= now &&
    this.quantityAvailable > 0
  );
});

// Virtual for checking if sold out
ticketTypeSchema.virtual('isSoldOut').get(function() {
  return this.quantityAvailable <= 0;
});

// Virtual for percentage sold
ticketTypeSchema.virtual('percentageSold').get(function() {
  if (this.quantity === 0) return 0;
  return Math.round((this.quantitySold / this.quantity) * 100);
});

// Method to check availability for a specific quantity
ticketTypeSchema.methods.checkAvailability = function(requestedQuantity) {
  if (!this.isActive) {
    return { available: false, reason: 'Ticket type is not active' };
  }
  
  const now = new Date();
  if (now < this.salesStartDate) {
    return { available: false, reason: 'Sales have not started yet' };
  }
  
  if (now > this.salesEndDate) {
    return { available: false, reason: 'Sales have ended' };
  }
  
  if (requestedQuantity < this.minQuantityPerOrder) {
    return { 
      available: false, 
      reason: `Minimum quantity per order is ${this.minQuantityPerOrder}` 
    };
  }
  
  if (requestedQuantity > this.maxQuantityPerOrder) {
    return { 
      available: false, 
      reason: `Maximum quantity per order is ${this.maxQuantityPerOrder}` 
    };
  }
  
  if (requestedQuantity > this.quantityAvailable) {
    return { 
      available: false, 
      reason: `Only ${this.quantityAvailable} tickets available` 
    };
  }
  
  return { available: true };
};

// Method to reserve tickets
ticketTypeSchema.methods.reserve = function(quantity) {
  const availability = this.checkAvailability(quantity);
  if (!availability.available) {
    throw new Error(availability.reason);
  }
  
  this.quantityReserved += quantity;
};

// Method to release reserved tickets
ticketTypeSchema.methods.releaseReservation = function(quantity) {
  if (quantity > this.quantityReserved) {
    throw new Error('Cannot release more tickets than are reserved');
  }
  
  this.quantityReserved -= quantity;
};

// Method to confirm ticket purchase (convert reservation to sale)
ticketTypeSchema.methods.confirmPurchase = function(quantity) {
  if (quantity > this.quantityReserved) {
    throw new Error('Cannot confirm more tickets than are reserved');
  }
  
  this.quantityReserved -= quantity;
  this.quantitySold += quantity;
};

// Method to refund tickets
ticketTypeSchema.methods.refund = function(quantity) {
  if (!this.isRefundable) {
    throw new Error('This ticket type is not refundable');
  }
  
  if (quantity > this.quantitySold) {
    throw new Error('Cannot refund more tickets than were sold');
  }
  
  this.quantitySold -= quantity;
};

// Method to deactivate ticket type
ticketTypeSchema.methods.deactivate = function() {
  this.isActive = false;
};

// Method to activate ticket type
ticketTypeSchema.methods.activate = function() {
  this.isActive = true;
};

// Ensure virtuals are included in JSON output
ticketTypeSchema.set('toJSON', { virtuals: true });
ticketTypeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TicketType', ticketTypeSchema);
