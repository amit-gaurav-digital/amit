const mongoose = require('mongoose');

const customDomainSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  subdomain: {
    type: String,
    lowercase: true
  },
  fullDomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'verifying', 'verified', 'active', 'failed', 'suspended'],
    default: 'pending'
  },
  verificationMethod: {
    type: String,
    enum: ['cname', 'txt', 'a-record'],
    default: 'cname'
  },
  verificationToken: String,
  dnsRecords: {
    cname: String,
    txt: String,
    aRecord: String,
    ttl: Number
  },
  sslCertificate: {
    provider: {
      type: String,
      enum: ['letsencrypt', 'manual', 'none'],
      default: 'letsencrypt'
    },
    issuer: String,
    issuedAt: Date,
    expiresAt: Date,
    autoRenew: {
      type: Boolean,
      default: true
    },
    certificatePath: String
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: false
  },
  redirectHttps: {
    type: Boolean,
    default: true
  },
  redirectWww: {
    type: Boolean,
    default: true
  },
  customHeaders: [{
    key: String,
    value: String
  }],
  analyticsEnabled: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastVerificationAt: Date,
  verificationFailureReason: String,
  verificationRetryCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

customDomainSchema.index({ userId: 1, status: 1 });
customDomainSchema.index({ fullDomain: 1 });
customDomainSchema.index({ 'sslCertificate.expiresAt': 1 });

module.exports = mongoose.model('CustomDomain', customDomainSchema);
