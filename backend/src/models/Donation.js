const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  // Donation Amount
  amount: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Donation amount must be greater than 0'
    }
  },

  // Payment Information
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit', 'debit', 'ach', 'btc', 'crypto'],
    default: 'credit'
  },
  
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },

  transactionId: {
    type: String,
    required: false,
    index: true
  },

  // Stripe-specific fields
  stripePaymentIntentId: {
    type: String,
    required: false
  },

  // ACH-specific fields
  bankAccountLast4: {
    type: String,
    required: false,
    match: [/^\d{4}$/, 'Bank account last 4 must be 4 digits']
  },

  bankAccountType: {
    type: String,
    required: false,
    enum: ['checking', 'savings']
  },

  bankName: {
    type: String,
    required: false,
    trim: true
  },

  achStatus: {
    type: String,
    required: false,
    enum: ['pending', 'processing', 'completed', 'failed', 'requires_verification'],
    default: 'pending'
  },

  plaidVerificationId: {
    type: String,
    required: false
  },

  microDepositAmounts: {
    type: [Number],
    required: false,
    validate: {
      validator: function(v) {
        return !v || v.length === 2;
      },
      message: 'Micro deposit amounts must be exactly 2 values'
    }
  },

  stripeBankAccountId: {
    type: String,
    required: false
  },

  achFailureReason: {
    type: String,
    required: false
  },

  // Donor Information (optional/anonymous)
  donorName: {
    type: String,
    default: 'Anonymous',
    trim: true,
    maxlength: 100
  },

  donorEmail: {
    type: String,
    trim: true,
    required: false,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },

  isAnonymous: {
    type: Boolean,
    default: true
  },

  // Optional Message
  message: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },

  // Metadata
  ipAddress: {
    type: String,
    required: false
  },

  userAgent: {
    type: String,
    required: false
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  completedAt: {
    type: Date,
    required: false
  }
});

// Index for efficient queries
donationSchema.index({ status: 1, createdAt: -1 });
donationSchema.index({ paymentMethod: 1 });
donationSchema.index({ transactionId: 1 });

// Virtual for display name
donationSchema.virtual('displayName').get(function() {
  return this.isAnonymous ? 'Anonymous' : this.donorName;
});

// Ensure virtuals are included in JSON
donationSchema.set('toJSON', { virtuals: true });
donationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Donation', donationSchema);
