const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema({
  // Stripe Settings
  stripePublishableKey: {
    type: String,
    default: '',
    trim: true
  },

  stripeSecretKey: {
    type: String,
    default: '',
    trim: true,
    select: false // Don't return by default for security
  },

  stripeWebhookSecret: {
    type: String,
    default: '',
    trim: true,
    select: false
  },

  stripeAccountId: {
    type: String,
    default: '',
    trim: true
  },

  // Bank Account Information (for ACH)
  bankAccountName: {
    type: String,
    default: '',
    trim: true
  },

  bankName: {
    type: String,
    default: '',
    trim: true
  },

  bankAccountNumber: {
    type: String,
    default: '',
    trim: true,
    select: false // Don't return by default for security
  },

  bankRoutingNumber: {
    type: String,
    default: '',
    trim: true,
    select: false
  },

  // Cryptocurrency Wallets
  btcWalletAddress: {
    type: String,
    default: '',
    trim: true
  },

  ethWalletAddress: {
    type: String,
    default: '',
    trim: true
  },

  usdcWalletAddress: {
    type: String,
    default: '',
    trim: true
  },

  // Payment Method Availability
  enableCreditCard: {
    type: Boolean,
    default: true
  },

  enableACH: {
    type: Boolean,
    default: false
  },

  enableBitcoin: {
    type: Boolean,
    default: false
  },

  enableCrypto: {
    type: Boolean,
    default: false
  },

  // Donation Settings
  minimumDonation: {
    type: Number,
    default: 1,
    min: 1
  },

  suggestedAmounts: {
    type: [Number],
    default: [5, 10, 25, 50, 100]
  },

  defaultMessage: {
    type: String,
    default: 'Support local Mendocino tattoo artist Nate Daugherty and help promote individual business growth in our community!',
    maxlength: 500
  },

  // Metadata
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
paymentSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get or create settings (singleton pattern)
paymentSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
