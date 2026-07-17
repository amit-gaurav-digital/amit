const mongoose = require('mongoose');

const blogWorkflowSchema = new mongoose.Schema({
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

  // Workflow State
  currentStage: {
    type: String,
    enum: ['draft', 'in_review', 'approved', 'published', 'rejected', 'on_hold'],
    default: 'draft'
  },
  previousStages: [{
    stage: String,
    enteredAt: Date,
    exitedAt: Date,
    by: mongoose.Schema.Types.ObjectId
  }],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  draftCompletedAt: Date,
  submittedForReviewAt: Date,
  reviewStartedAt: Date,
  reviewCompletedAt: Date,
  approvedAt: Date,
  publishedAt: Date,
  rejectedAt: Date,

  // Current Stage Details
  stage: {
    name: String,
    enteredBy: mongoose.Schema.Types.ObjectId,
    enteredAt: Date,
    dueDate: Date,
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    }
  },

  // Review Information
  reviewers: [{
    userId: mongoose.Schema.Types.ObjectId,
    assignedAt: Date,
    assignedBy: mongoose.Schema.Types.ObjectId,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      default: 'pending'
    },
    completedAt: Date,
    feedback: String
  }],

  // Approvers
  approvers: [{
    userId: mongoose.Schema.Types.ObjectId,
    assignedAt: Date,
    role: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    completedAt: Date,
    feedback: String
  }],

  // Rejection/Hold Information
  rejectionReason: String,
  rejectedBy: mongoose.Schema.Types.ObjectId,
  holdReason: String,
  onHoldSince: Date,
  onHoldBy: mongoose.Schema.Types.ObjectId,

  // Comments Thread
  comments: [{
    commentId: mongoose.Schema.Types.ObjectId,
    author: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String,
      role: String
    },
    text: String,
    mentions: [mongoose.Schema.Types.ObjectId],
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    replies: [{
      replyId: mongoose.Schema.Types.ObjectId,
      author: {
        userId: mongoose.Schema.Types.ObjectId,
        name: String,
        role: String
      },
      text: String,
      createdAt: Date
    }],
    reactions: {
      likes: [mongoose.Schema.Types.ObjectId],
      helpful: [mongoose.Schema.Types.ObjectId]
    }
  }],

  // Change Requests
  changeRequests: [{
    id: mongoose.Schema.Types.ObjectId,
    requestedBy: mongoose.Schema.Types.ObjectId,
    requestedAt: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    description: String,
    section: String,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'dismissed'],
      default: 'pending'
    },
    resolvedAt: Date,
    resolvedBy: mongoose.Schema.Types.ObjectId,
    resolutionNotes: String
  }],

  // Notification Preferences
  notificationPreferences: {
    reviewAssigned: { type: Boolean, default: true },
    reviewCompleted: { type: Boolean, default: true },
    changeRequested: { type: Boolean, default: true },
    approved: { type: Boolean, default: true },
    rejected: { type: Boolean, default: true },
    published: { type: Boolean, default: true }
  },

  // Metadata
  metadata: {
    customFields: mongoose.Schema.Types.Map,
    tags: [String],
    labels: [String]
  },

  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
blogWorkflowSchema.index({ blogId: 1, clientId: 1 });
blogWorkflowSchema.index({ currentStage: 1, clientId: 1 });
blogWorkflowSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BlogWorkflow', blogWorkflowSchema);
