const mongoose = require('mongoose');

const socialMediaConnectionSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['instagram', 'facebook', 'twitter', 'tiktok', 'pinterest', 'youtube', 'google_photos'],
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  username: {
    type: String,
    default: ''
  },
  profileUrl: {
    type: String,
    default: ''
  },
  accessToken: {
    type: String,
    default: '',
    select: false // Don't return in queries by default for security
  },
  refreshToken: {
    type: String,
    default: '',
    select: false
  },
  tokenExpiry: {
    type: Date
  },
  lastSync: {
    type: Date
  },
  autoSync: {
    type: Boolean,
    default: false
  },
  syncFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'manual'],
    default: 'manual'
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  stats: {
    followers: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    lastPostDate: { type: Date }
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  connectedAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

socialMediaConnectionSchema.index({ platform: 1 });
socialMediaConnectionSchema.index({ isConnected: 1 });

module.exports = mongoose.model('SocialMediaConnection', socialMediaConnectionSchema);
