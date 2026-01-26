const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'unavailable'],
    default: 'available'
  },
  slots: [{
    time: String, // e.g., "10:00 AM", "2:00 PM"
    isBooked: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String, // Admin notes, not visible to clients
    maxlength: 500
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

// Index for efficient date queries
availabilitySchema.index({ date: 1 });
availabilitySchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);
