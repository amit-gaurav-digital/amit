const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'editor', 'reviewer', 'viewer']
  },
  description: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'blog.create',
      'blog.read',
      'blog.edit.own',
      'blog.edit.all',
      'blog.delete.own',
      'blog.delete.all',
      'blog.approve',
      'blog.publish',
      'blog.unpublish',
      'user.create',
      'user.read',
      'user.edit.own',
      'user.edit.all',
      'user.delete',
      'role.manage',
      'permission.manage',
      'settings.view',
      'settings.edit',
      'audit.view',
      'analytics.view'
    ]
  }],
  isBuiltIn: {
    type: Boolean,
    default: true
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

roleSchema.index({ name: 1 });

const defaultRoles = [
  {
    name: 'admin',
    description: 'Full system access',
    permissions: [
      'blog.create', 'blog.read', 'blog.edit.all', 'blog.delete.all',
      'blog.approve', 'blog.publish', 'blog.unpublish',
      'user.create', 'user.read', 'user.edit.all', 'user.delete',
      'role.manage', 'permission.manage',
      'settings.view', 'settings.edit',
      'audit.view', 'analytics.view'
    ],
    isBuiltIn: true
  },
  {
    name: 'editor',
    description: 'Can create and edit own blogs',
    permissions: [
      'blog.create', 'blog.read', 'blog.edit.own', 'blog.delete.own',
      'user.read', 'user.edit.own',
      'settings.view', 'analytics.view'
    ],
    isBuiltIn: true
  },
  {
    name: 'reviewer',
    description: 'Can approve and publish blogs',
    permissions: [
      'blog.read', 'blog.approve', 'blog.publish', 'blog.unpublish',
      'user.read', 'user.edit.own',
      'settings.view', 'analytics.view'
    ],
    isBuiltIn: true
  },
  {
    name: 'viewer',
    description: 'Read-only access',
    permissions: [
      'blog.read', 'user.read', 'user.edit.own',
      'settings.view', 'analytics.view'
    ],
    isBuiltIn: true
  }
];

roleSchema.statics.seedDefaultRoles = async function() {
  for (const role of defaultRoles) {
    await this.findOneAndUpdate(
      { name: role.name },
      role,
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Role', roleSchema);
