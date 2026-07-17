const mongoose = require('mongoose');

const workflowTemplateSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  isDefault: {
    type: Boolean,
    default: false
  },

  // Workflow Stages Configuration
  stages: [{
    name: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'published'],
      required: true
    },
    displayName: String,
    description: String,
    requiresReview: Boolean,
    reviewerRoles: [String],
    minReviewersRequired: Number,
    maxDaysInStage: Number,
    allowAutoTransition: Boolean,
    autoTransitionConditions: {
      allReviewersApproved: Boolean,
      afterDays: Number
    }
  }],

  // Role-based Rules
  roleRules: [{
    role: String,
    canCreate: Boolean,
    canEdit: Boolean,
    canReview: Boolean,
    canApprove: Boolean,
    canPublish: Boolean,
    canReject: Boolean,
    canAssignReviewers: Boolean,
    canViewAnalytics: Boolean
  }],

  // Notification Rules
  notificationRules: [{
    trigger: String,
    stage: String,
    roles: [String],
    channels: [String],
    template: String
  }],

  // Escalation Rules
  escalationRules: [{
    condition: String,
    afterDays: Number,
    escalateTo: String,
    action: String
  }],

  // Custom Fields
  customFields: [{
    fieldId: String,
    fieldName: String,
    fieldType: String,
    required: Boolean,
    displayAtStage: String
  }],

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

workflowTemplateSchema.index({ clientId: 1, isDefault: 1 });
workflowTemplateSchema.index({ clientId: 1, isActive: 1 });

module.exports = mongoose.model('WorkflowTemplate', workflowTemplateSchema);
