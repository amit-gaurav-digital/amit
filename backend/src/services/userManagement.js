const User = require('../models/User');
const Role = require('../models/Role');
const UserAudit = require('../models/UserAudit');
const Blog = require('../models/Blog');

class UserManagementService {
  async createUser(userData, ipAddress, userAgent) {
    try {
      const { email, password, name, role, department } = userData;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already exists');
      }

      const user = new User({
        email,
        passwordHash: password,
        name,
        role: role || 'viewer',
        department,
        isActive: true
      });

      await user.save();

      await UserAudit.logAction(
        'admin',
        'user_created',
        'user',
        user._id,
        user.email,
        { before: null, after: user.toJSON() },
        ipAddress,
        userAgent
      );

      return user.toJSON();
    } catch (error) {
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  async updateUser(userId, updateData, ipAddress, userAgent) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const before = user.toJSON();

      const allowedUpdates = ['name', 'department', 'notificationPreferences'];

      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          user[key] = updateData[key];
        }
      });

      await user.save();

      const after = user.toJSON();

      await UserAudit.logAction(
        userId,
        'user_updated',
        'user',
        user._id,
        user.email,
        { before, after },
        ipAddress,
        userAgent
      );

      return after;
    } catch (error) {
      throw new Error(`User update failed: ${error.message}`);
    }
  }

  async assignRole(userId, role, adminId, ipAddress, userAgent) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const roleExists = await Role.findOne({ name: role });

      if (!roleExists) {
        throw new Error('Role does not exist');
      }

      const before = user.toJSON();
      user.role = role;
      await user.save();
      const after = user.toJSON();

      await UserAudit.logAction(
        adminId,
        'role_assigned',
        'user',
        user._id,
        user.email,
        { before, after },
        ipAddress,
        userAgent
      );

      return after;
    } catch (error) {
      throw new Error(`Role assignment failed: ${error.message}`);
    }
  }

  async deactivateUser(userId, adminId, ipAddress, userAgent) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const before = user.toJSON();
      user.isActive = false;
      await user.save();
      const after = user.toJSON();

      await UserAudit.logAction(
        adminId,
        'user_deactivated',
        'user',
        user._id,
        user.email,
        { before, after },
        ipAddress,
        userAgent
      );

      return after;
    } catch (error) {
      throw new Error(`User deactivation failed: ${error.message}`);
    }
  }

  async activateUser(userId, adminId, ipAddress, userAgent) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const before = user.toJSON();
      user.isActive = true;
      await user.save();
      const after = user.toJSON();

      await UserAudit.logAction(
        adminId,
        'user_activated',
        'user',
        user._id,
        user.email,
        { before, after },
        ipAddress,
        userAgent
      );

      return after;
    } catch (error) {
      throw new Error(`User activation failed: ${error.message}`);
    }
  }

  async getUserStats(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const stats = {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        blogsCreated: await Blog.countDocuments({ createdBy: userId }),
        blogsApproved: await Blog.countDocuments({ approvedBy: userId }),
        blogsPublished: await Blog.countDocuments({ createdBy: userId, status: 'published' }),
        blogsPending: await Blog.countDocuments({ createdBy: userId, status: 'draft' }),
        blogsRejected: await Blog.countDocuments({ createdBy: userId, status: 'rejected' }),
        lastLogin: user.lastLogin,
        joinDate: user.createdAt
      };

      return stats;
    } catch (error) {
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }

  async getUserAuditLog(userId, options = {}) {
    try {
      const {
        limit = 50,
        skip = 0,
        actionType = null,
        startDate = null,
        endDate = null
      } = options;

      const query = { userId };

      if (actionType) {
        query.actionType = actionType;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const logs = await UserAudit.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await UserAudit.countDocuments(query);

      return {
        logs,
        total,
        limit,
        skip,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Audit log retrieval failed: ${error.message}`);
    }
  }

  async searchUsers(query, options = {}) {
    try {
      const {
        role = null,
        isActive = true,
        limit = 50,
        skip = 0
      } = options;

      const searchQuery = {
        $or: [
          { email: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } }
        ]
      };

      if (role) {
        searchQuery.role = role;
      }

      if (isActive !== null) {
        searchQuery.isActive = isActive;
      }

      const users = await User.find(searchQuery)
        .select('-passwordHash -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await User.countDocuments(searchQuery);

      return {
        users,
        total,
        limit,
        skip,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`User search failed: ${error.message}`);
    }
  }

  async getAllUsers(options = {}) {
    try {
      const {
        limit = 50,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = -1
      } = options;

      const sortObj = {};
      sortObj[sortBy] = sortOrder;

      const users = await User.find()
        .select('-passwordHash -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil')
        .sort(sortObj)
        .limit(limit)
        .skip(skip);

      const total = await User.countDocuments();

      return {
        users,
        total,
        limit,
        skip,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`User retrieval failed: ${error.message}`);
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-passwordHash -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`User retrieval failed: ${error.message}`);
    }
  }

  async bulkAssignRole(userIds, role, adminId, ipAddress, userAgent) {
    try {
      const roleExists = await Role.findOne({ name: role });

      if (!roleExists) {
        throw new Error('Role does not exist');
      }

      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { role }
      );

      await UserAudit.logAction(
        adminId,
        'role_assigned',
        'user',
        null,
        `Bulk role assignment to ${userIds.length} users`,
        { before: null, after: { role, userCount: userIds.length } },
        ipAddress,
        userAgent
      );

      return result;
    } catch (error) {
      throw new Error(`Bulk role assignment failed: ${error.message}`);
    }
  }

  async bulkDeactivateUsers(userIds, adminId, ipAddress, userAgent) {
    try {
      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { isActive: false }
      );

      await UserAudit.logAction(
        adminId,
        'user_deactivated',
        'user',
        null,
        `Bulk deactivation of ${userIds.length} users`,
        { before: null, after: { isActive: false, userCount: userIds.length } },
        ipAddress,
        userAgent
      );

      return result;
    } catch (error) {
      throw new Error(`Bulk user deactivation failed: ${error.message}`);
    }
  }
}

module.exports = new UserManagementService();
