const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const UserAudit = require('../models/UserAudit');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this';
    this.jwtExpiry = process.env.JWT_EXPIRY || '24h';
    this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
    this.passwordMinLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 12;
  }

  async register(email, password, name, ipAddress, userAgent) {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      if (password.length < this.passwordMinLength) {
        throw new Error(`Password must be at least ${this.passwordMinLength} characters`);
      }

      if (!this.validatePasswordStrength(password)) {
        throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
      }

      const user = new User({
        email,
        passwordHash: password,
        name,
        role: process.env.DEFAULT_USER_ROLE || 'viewer',
        isActive: process.env.ENABLE_USER_REGISTRATION === 'true'
      });

      await user.save();

      await UserAudit.logAction(
        user._id,
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
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(email, password, ipAddress, userAgent) {
    try {
      const user = await User.findOne({ email });

      if (!user || !user.isActive) {
        await UserAudit.logAction(
          user?._id || 'unknown',
          'login_failed',
          'user',
          null,
          email,
          null,
          ipAddress,
          userAgent,
          'failed',
          'User not found or inactive'
        );
        throw new Error('Invalid credentials');
      }

      if (user.isLocked()) {
        await UserAudit.logAction(
          user._id,
          'account_locked',
          'user',
          user._id,
          user.email,
          null,
          ipAddress,
          userAgent,
          'failed',
          'Account locked due to too many login attempts'
        );
        throw new Error('Account locked. Try again in 15 minutes');
      }

      const isValidPassword = await user.comparePassword(password);

      if (!isValidPassword) {
        await user.incLoginAttempts();
        await UserAudit.logAction(
          user._id,
          'login_failed',
          'user',
          user._id,
          user.email,
          null,
          ipAddress,
          userAgent,
          'failed',
          `Invalid password (${user.loginAttempts + 1} attempts)`
        );
        throw new Error('Invalid credentials');
      }

      await user.resetLoginAttempts();
      user.lastLogin = new Date();
      await user.save();

      await UserAudit.logAction(
        user._id,
        'login',
        'user',
        user._id,
        user.email,
        null,
        ipAddress,
        userAgent
      );

      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        user: user.toJSON(),
        token,
        refreshToken
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async logout(userId, ipAddress, userAgent) {
    try {
      const user = await User.findById(userId);

      if (user) {
        await UserAudit.logAction(
          userId,
          'logout',
          'user',
          user._id,
          user.email,
          null,
          ipAddress,
          userAgent
        );
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  async changePassword(userId, oldPassword, newPassword, ipAddress, userAgent) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await user.comparePassword(oldPassword);

      if (!isValidPassword) {
        await UserAudit.logAction(
          userId,
          'password_changed',
          'user',
          user._id,
          user.email,
          null,
          ipAddress,
          userAgent,
          'failed',
          'Invalid current password'
        );
        throw new Error('Current password is incorrect');
      }

      if (newPassword.length < this.passwordMinLength) {
        throw new Error(`Password must be at least ${this.passwordMinLength} characters`);
      }

      if (!this.validatePasswordStrength(newPassword)) {
        throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
      }

      user.passwordHash = newPassword;
      await user.save();

      await UserAudit.logAction(
        userId,
        'password_changed',
        'user',
        user._id,
        user.email,
        { before: null, after: null },
        ipAddress,
        userAgent
      );

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  async requestPasswordReset(email, ipAddress, userAgent) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        return { success: true, message: 'If email exists, reset link will be sent' };
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      await UserAudit.logAction(
        user._id,
        'password_reset',
        'user',
        user._id,
        user.email,
        null,
        ipAddress,
        userAgent
      );

      return { success: true, resetToken, message: 'Password reset link sent' };
    } catch (error) {
      throw new Error(`Password reset request failed: ${error.message}`);
    }
  }

  async resetPassword(resetToken, newPassword, ipAddress, userAgent) {
    try {
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      if (newPassword.length < this.passwordMinLength) {
        throw new Error(`Password must be at least ${this.passwordMinLength} characters`);
      }

      if (!this.validatePasswordStrength(newPassword)) {
        throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
      }

      user.passwordHash = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      await UserAudit.logAction(
        user._id,
        'password_reset',
        'user',
        user._id,
        user.email,
        null,
        ipAddress,
        userAgent
      );

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  generateToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiry }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        type: 'refresh'
      },
      this.jwtSecret,
      { expiresIn: this.refreshTokenExpiry }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  validatePasswordStrength(password) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return hasUppercase && hasLowercase && hasNumbers && hasSpecial;
  }
}

module.exports = new AuthService();
