const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  // Personal Details
  fullName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  bestContactTime: {
    type: String,
    required: true
  },
  
  // Tattoo Details
  tattooDescription: {
    type: String,
    required: true
  },
  backgroundStory: {
    type: String,
    required: true
  },
  desiredPlacement: {
    type: String,
    required: true
  },
  painThreshold: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  
  // Reference Images
  referenceImages: [{
    filename: String,
    path: String,
    url: String
  }],
  
  // Selfie for Preview
  selfieImage: {
    filename: String,
    path: String,
    url: String
  },
  
  // Preview Images (AI Generated)
  previewImages: [{
    filename: String,
    path: String,
    url: String,
    createdAt: Date
  }],
  
  // VIP Services
  vipServices: {
    priorityScheduling: {
      type: Boolean,
      default: false
    },
    homeVisit: {
      type: Boolean,
      default: false
    },
    travelService: {
      type: Boolean,
      default: false
    },
    extendedSession: {
      type: Boolean,
      default: false
    },
    deadline: Date
  },
  
  // Consultation Details
  consultationType: {
    type: String,
    enum: ['phone', 'in-person'],
    default: 'phone'
  },
  preferredDate: Date,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Admin Notes
  adminNotes: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Consultation', consultationSchema);
