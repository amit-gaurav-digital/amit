const mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['twitter', 'facebook', 'instagram'],
    required: true
  },
  accountName: String,
  accountId: String,
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: String,
  expiresAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isConnected: {
    type: Boolean,
    default: true
  },
  profileImage: String,
  followers: {
    type: Number,
    default: 0
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  disconnectedAt: Date,
  lastErrorMessage: String,
  lastErrorAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

socialMediaSchema.index({ userId: 1, platform: 1 }, { unique: true });
socialMediaSchema.index({ platform: 1, isActive: 1 });
socialMediaSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('SocialMedia', socialMediaSchema);
