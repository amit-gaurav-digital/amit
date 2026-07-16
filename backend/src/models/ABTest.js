const mongoose = require('mongoose');

const abTestSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  testType: {
    type: String,
    enum: ['headline', 'content', 'image', 'cta', 'meta-description'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  testField: {
    type: String,
    required: true
  },
  variants: [{
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    value: String,
    label: String,
    isControl: Boolean,
    startDate: Date,
    endDate: Date
  }],
  configuration: {
    splitPercentage: {
      type: Number,
      default: 50,
      min: 1,
      max: 99
    },
    minSampleSize: {
      type: Number,
      default: 100
    },
    confidenceLevel: {
      type: Number,
      default: 0.95,
      enum: [0.90, 0.95, 0.99]
    },
    duration: {
      type: Number,
      default: 7,
      description: 'Duration in days'
    },
    autoSelect: {
      type: Boolean,
      default: false
    },
    autoSelectThreshold: {
      type: Number,
      default: 0.05
    }
  },
  results: {
    winner: {
      variantId: mongoose.Schema.Types.ObjectId,
      variantName: String,
      improvement: Number,
      significanceLevel: Number,
      selectedAt: Date
    },
    startedAt: Date,
    completedAt: Date,
    status: {
      type: String,
      enum: ['not-started', 'running', 'analysis-pending', 'completed'],
      default: 'not-started'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

abTestSchema.index({ blogId: 1, status: 1 });
abTestSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('ABTest', abTestSchema);
