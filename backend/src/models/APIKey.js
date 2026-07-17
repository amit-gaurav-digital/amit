const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  keyHash: {
    type: String,
    required: true,
    unique: true
  },
  keyName: {
    type: String,
    required: true
  },
  permissions: {
    type: [String],
    enum: ['read:blogs', 'write:blogs', 'publish:blogs', 'read:analytics', 'admin'],
    default: ['read:blogs']
  },
  rateLimit: {
    requests: { type: Number, default: 1000 },
    window: { type: String, default: '1h' }
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  lastUsedAt: Date,
  lastUsedIp: String,
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

apiKeySchema.index({ clientId: 1 });
apiKeySchema.index({ keyHash: 1 });
apiKeySchema.index({ isActive: 1 });

apiKeySchema.statics.generateKey = function() {
  const key = 'sk_live_' + crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, hash };
};

apiKeySchema.methods.recordUsage = function(ipAddress) {
  this.lastUsedAt = new Date();
  this.lastUsedIp = ipAddress;
  this.totalRequests += 1;
  return this.save();
};

module.exports = mongoose.model('APIKey', apiKeySchema);
