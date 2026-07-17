const mongoose = require('mongoose');

const workflowNotificationSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },

  // Notification Details
  type: {
    type: String,
    enum: [
      'reviewer_assigned',
      'review_completed',
      'changes_requested',
      'approved',
      'rejected',
      'published',
      'scheduled_publish',
      'escalation',
      'comment_mention'
    ],
    required: true
  },

  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  recipientEmail: String,

  // Notification Content
  subject: String,
  message: String,
  actionUrl: String,

  // Delivery Channels
  channels: {
    email: {
      sent: Boolean,
      sentAt: Date,
      openedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'bounced'],
        default: 'pending'
      }
    },
    inApp: {
      sent: Boolean,
      sentAt: Date,
      readAt: Date,
      status: {
        type: String,
        enum: ['pending', 'sent', 'read'],
        default: 'pending'
      }
    },
    slack: {
      sent: Boolean,
      sentAt: Date,
      status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
      },
      slackThreadId: String
    },
    webhook: {
      sent: Boolean,
      sentAt: Date,
      status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
      },
      webhookUrl: String,
      retryCount: Number
    }
  },

  // Metadata
  triggerBy: mongoose.Schema.Types.ObjectId,
  triggerAction: String,
  relatedCommentId: mongoose.Schema.Types.ObjectId,
  relatedChangeRequestId: mongoose.Schema.Types.ObjectId,

  // Tracking
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  archived: {
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: Date
});

// TTL index for automatic cleanup (optional: set to 30 days)
workflowNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes for queries
workflowNotificationSchema.index({ recipientId: 1, read: 1 });
workflowNotificationSchema.index({ clientId: 1, createdAt: -1 });
workflowNotificationSchema.index({ blogId: 1, type: 1 });

module.exports = mongoose.model('WorkflowNotification', workflowNotificationSchema);
