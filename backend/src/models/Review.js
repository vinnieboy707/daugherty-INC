const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Review Details
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Author Information (optional for anonymous)
  authorName: {
    type: String,
    default: 'Anonymous',
    trim: true,
    maxlength: 50
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Review Metadata
  tattooType: {
    type: String,
    enum: ['portrait', 'traditional', 'tribal', 'geometric', 'realistic', 'abstract', 'lettering', 'other'],
    required: false
  },
  
  // Moderation
  isApproved: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Engagement
  helpfulCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
reviewSchema.index({ isApproved: 1, isVisible: 1, createdAt: -1 });
reviewSchema.index({ isFeatured: 1, rating: -1 });
reviewSchema.index({ rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);
