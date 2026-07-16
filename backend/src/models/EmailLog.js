const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
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
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  },
  subject: {
    type: String,
    required: true
  },
  notificationType: {
    type: String,
    enum: ['new_draft', 'draft_published', 'draft_scheduled', 'comment_reply', 'blog_update', 'weekly_digest'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  errorMessage: String,
  attemptCount: {
    type: Number,
    default: 0
  },
  sentAt: Date,
  openedAt: Date,
  clickedAt: Date,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

emailLogSchema.index({ userId: 1, sentAt: -1 });
emailLogSchema.index({ email: 1, status: 1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ blogId: 1, notificationType: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
