const mongoose = require('mongoose');

const emailNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true
  },
  notificationType: {
    type: String,
    enum: ['new_draft', 'draft_published', 'draft_scheduled', 'comment_reply', 'blog_update', 'weekly_digest'],
    required: true
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  frequency: {
    type: String,
    enum: ['immediate', 'daily', 'weekly', 'never'],
    default: 'immediate'
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

emailNotificationSchema.index({ userId: 1, notificationType: 1 }, { unique: true });
emailNotificationSchema.index({ userId: 1, isEnabled: 1 });

module.exports = mongoose.model('EmailNotification', emailNotificationSchema);
