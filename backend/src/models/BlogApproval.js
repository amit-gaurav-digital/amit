const mongoose = require('mongoose');

const blogApprovalSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'changes_requested'],
    default: 'pending'
  },
  comments: [{
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  changeRequests: [{
    section: String,
    feedback: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  history: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: { type: Date, default: Date.now },
    reason: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

blogApprovalSchema.index({ blogId: 1 });
blogApprovalSchema.index({ clientId: 1 });
blogApprovalSchema.index({ status: 1 });

module.exports = mongoose.model('BlogApproval', blogApprovalSchema);
