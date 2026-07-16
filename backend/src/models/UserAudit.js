const mongoose = require('mongoose');

const userAuditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    enum: [
      'login', 'logout', 'login_failed', 'account_locked',
      'password_changed', 'password_reset',
      'blog_created', 'blog_edited', 'blog_deleted',
      'blog_submitted', 'blog_approved', 'blog_rejected', 'blog_published', 'blog_unpublished',
      'user_created', 'user_updated', 'user_deleted', 'user_activated', 'user_deactivated',
      'role_assigned', 'permissions_updated',
      'settings_updated', 'system_action'
    ],
    required: true
  },
  resourceType: {
    type: String,
    enum: ['user', 'blog', 'role', 'permission', 'settings', 'system'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  resourceName: {
    type: String,
    default: null
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 7776000
  }
});

userAuditSchema.index({ userId: 1, createdAt: -1 });
userAuditSchema.index({ actionType: 1, createdAt: -1 });
userAuditSchema.index({ resourceType: 1, resourceId: 1 });

userAuditSchema.pre('save', async function(next) {
  if (this.isNew && this.userId) {
    await this.populate('userId', 'name email');
  }
  next();
});

userAuditSchema.methods.log = async function() {
  return this.save();
};

userAuditSchema.statics.logAction = async function(
  userId,
  actionType,
  resourceType,
  resourceId,
  resourceName,
  changes,
  ipAddress,
  userAgent,
  status = 'success',
  errorMessage = null
) {
  const audit = new this({
    userId,
    actionType,
    resourceType,
    resourceId,
    resourceName,
    changes,
    ipAddress,
    userAgent,
    status,
    errorMessage
  });

  return audit.save();
};

module.exports = mongoose.model('UserAudit', userAuditSchema);
