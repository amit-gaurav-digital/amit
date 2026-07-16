const mongoose = require('mongoose');

const socialMediaPostSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  platforms: [{
    platform: {
      type: String,
      enum: ['twitter', 'facebook', 'instagram']
    },
    postId: String,
    url: String,
    postedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    errorMessage: String,
    engagement: {
      likes: {
        type: Number,
        default: 0
      },
      comments: {
        type: Number,
        default: 0
      },
      shares: {
        type: Number,
        default: 0
      },
      views: {
        type: Number,
        default: 0
      }
    },
    lastUpdatedAt: Date
  }],
  content: {
    title: String,
    description: String,
    url: String,
    imageUrl: String,
    hashtags: [String]
  },
  scheduledFor: Date,
  publishedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

socialMediaPostSchema.index({ blogId: 1, publishedAt: -1 });
socialMediaPostSchema.index({ userId: 1, createdAt: -1 });
socialMediaPostSchema.index({ scheduledFor: 1 });

module.exports = mongoose.model('SocialMediaPost', socialMediaPostSchema);
