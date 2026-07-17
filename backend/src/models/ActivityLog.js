const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    enum: [
      'blog_created',
      'blog_updated',
      'blog_published',
      'blog_scheduled',
      'blog_deleted',
      'blog_restored',
      'blog_submitted_review',
      'blog_approved',
      'blog_rejected',
      'settings_updated',
      'api_key_created',
      'api_key_revoked',
      'user_invited',
      'user_role_changed'
    ],
    required: true
  },
  resourceType: {
    type: String,
    enum: ['blog', 'client', 'settings', 'api_key', 'user'],
    required: true
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  resourceName: String,
  details: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    changedFields: [String]
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: false });

activityLogSchema.index({ clientId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1 });

activityLogSchema.statics.logAction = async function(
  clientId,
  userId,
  action,
  resourceType,
  resourceId,
  resourceName,
  details,
  ipAddress,
  userAgent,
  status = 'success',
  errorMessage = null
) {
  try {
    const log = new this({
      clientId,
      userId,
      action,
      resourceType,
      resourceId,
      resourceName,
      details,
      ipAddress,
      userAgent,
      status,
      errorMessage
    });
    return await log.save();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
