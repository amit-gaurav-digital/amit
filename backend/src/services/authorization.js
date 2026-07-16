const User = require('../models/User');
const Role = require('../models/Role');
const Blog = require('../models/Blog');

class AuthorizationService {
  async hasPermission(userId, permission) {
    try {
      const user = await User.findById(userId);

      if (!user || !user.isActive) {
        return false;
      }

      const role = await Role.findOne({ name: user.role });

      if (!role) {
        return false;
      }

      return role.permissions.includes(permission) || user.permissions.includes(permission);
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  async hasRole(userId, requiredRole) {
    try {
      const user = await User.findById(userId);

      if (!user || !user.isActive) {
        return false;
      }

      if (user.role === 'admin') {
        return true;
      }

      const roleHierarchy = {
        'admin': 4,
        'reviewer': 3,
        'editor': 2,
        'viewer': 1
      };

      return (roleHierarchy[user.role] || 0) >= (roleHierarchy[requiredRole] || 0);
    } catch (error) {
      console.error('Role check error:', error);
      return false;
    }
  }

  async canEditBlog(userId, blogId) {
    try {
      const hasPermission = await this.hasPermission(userId, 'blog.edit.all');

      if (hasPermission) {
        return true;
      }

      const blog = await Blog.findById(blogId);

      if (!blog) {
        return false;
      }

      const canEditOwn = await this.hasPermission(userId, 'blog.edit.own');
      return canEditOwn && blog.createdBy.toString() === userId.toString();
    } catch (error) {
      console.error('Blog edit permission check error:', error);
      return false;
    }
  }

  async canDeleteBlog(userId, blogId) {
    try {
      const hasPermission = await this.hasPermission(userId, 'blog.delete.all');

      if (hasPermission) {
        return true;
      }

      const blog = await Blog.findById(blogId);

      if (!blog) {
        return false;
      }

      const canDeleteOwn = await this.hasPermission(userId, 'blog.delete.own');
      return canDeleteOwn && blog.createdBy.toString() === userId.toString();
    } catch (error) {
      console.error('Blog delete permission check error:', error);
      return false;
    }
  }

  async canApproveBlog(userId) {
    return this.hasPermission(userId, 'blog.approve');
  }

  async canPublishBlog(userId) {
    return this.hasPermission(userId, 'blog.publish');
  }

  async canManageUsers(userId) {
    return this.hasPermission(userId, 'user.create');
  }

  async canViewAudit(userId) {
    return this.hasPermission(userId, 'audit.view');
  }

  async canViewSettings(userId) {
    return this.hasPermission(userId, 'settings.view');
  }

  async canEditSettings(userId) {
    return this.hasPermission(userId, 'settings.edit');
  }

  async getFilteredBlogQuery(userId, baseQuery = {}) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return null;
      }

      if (user.role === 'admin' || user.role === 'reviewer') {
        return baseQuery;
      }

      if (user.role === 'editor') {
        return { ...baseQuery, createdBy: userId };
      }

      return { ...baseQuery, status: 'published' };
    } catch (error) {
      console.error('Query filter error:', error);
      return null;
    }
  }

  requirePermission(permission) {
    return async (req, res, next) => {
      try {
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: 'Not authenticated' });
        }

        const hasPermission = await this.hasPermission(userId, permission);

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: permission
          });
        }

        next();
      } catch (error) {
        res.status(500).json({ error: 'Permission check failed' });
      }
    };
  }

  requireRole(requiredRole) {
    return async (req, res, next) => {
      try {
        const userId = req.user?.userId;

        if (!userId) {
          return res.status(401).json({ error: 'Not authenticated' });
        }

        const hasRole = await this.hasRole(userId, requiredRole);

        if (!hasRole) {
          return res.status(403).json({
            error: 'Insufficient role',
            required: requiredRole
          });
        }

        next();
      } catch (error) {
        res.status(500).json({ error: 'Role check failed' });
      }
    };
  }

  requireAuth = (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = require('./auth').verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

module.exports = new AuthorizationService();
