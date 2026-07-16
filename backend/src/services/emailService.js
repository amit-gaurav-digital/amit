const nodemailer = require('nodemailer');
const EmailNotification = require('../models/EmailNotification');
const EmailLog = require('../models/EmailLog');
const Blog = require('../models/Blog');
const User = require('../models/User');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : null
    });

    this.fromEmail = process.env.FROM_EMAIL || 'noreply@blogging-platform.com';
  }

  async updateNotificationPreference(userId, notificationType, frequency, isEnabled = true) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const preference = await EmailNotification.findOneAndUpdate(
        { userId, notificationType },
        {
          email: user.email,
          frequency,
          isEnabled
        },
        { upsert: true, new: true }
      );

      return preference.toObject();
    } catch (error) {
      throw new Error(`Failed to update notification preference: ${error.message}`);
    }
  }

  async getNotificationPreferences(userId) {
    try {
      const preferences = await EmailNotification.find({ userId })
        .select('-__v')
        .sort({ notificationType: 1 });

      return preferences.map(p => p.toObject());
    } catch (error) {
      throw new Error(`Failed to get notification preferences: ${error.message}`);
    }
  }

  async sendNewDraftNotification(blogId, userId) {
    try {
      const blog = await Blog.findById(blogId);
      const user = await User.findById(userId);

      if (!blog || !user) {
        throw new Error('Blog or user not found');
      }

      const preference = await EmailNotification.findOne({
        userId,
        notificationType: 'new_draft'
      });

      if (!preference || !preference.isEnabled) {
        return { skipped: true, reason: 'Notification disabled' };
      }

      const subject = `New Draft Created: ${blog.title}`;
      const html = this.getNewDraftTemplate(blog, user);

      return this.sendEmail(user.email, subject, html, userId, blogId, 'new_draft', { blogTitle: blog.title });
    } catch (error) {
      throw new Error(`Failed to send new draft notification: ${error.message}`);
    }
  }

  async sendPublishedNotification(blogId, userId) {
    try {
      const blog = await Blog.findById(blogId);
      const user = await User.findById(userId);

      if (!blog || !user) {
        throw new Error('Blog or user not found');
      }

      const preference = await EmailNotification.findOne({
        userId,
        notificationType: 'draft_published'
      });

      if (!preference || !preference.isEnabled) {
        return { skipped: true, reason: 'Notification disabled' };
      }

      const subject = `Blog Published: ${blog.title}`;
      const html = this.getPublishedTemplate(blog, user);

      return this.sendEmail(user.email, subject, html, userId, blogId, 'draft_published', { blogTitle: blog.title });
    } catch (error) {
      throw new Error(`Failed to send published notification: ${error.message}`);
    }
  }

  async sendScheduledNotification(blogId, userId, scheduledDate) {
    try {
      const blog = await Blog.findById(blogId);
      const user = await User.findById(userId);

      if (!blog || !user) {
        throw new Error('Blog or user not found');
      }

      const preference = await EmailNotification.findOne({
        userId,
        notificationType: 'draft_scheduled'
      });

      if (!preference || !preference.isEnabled) {
        return { skipped: true, reason: 'Notification disabled' };
      }

      const subject = `Blog Scheduled: ${blog.title}`;
      const html = this.getScheduledTemplate(blog, user, scheduledDate);

      return this.sendEmail(user.email, subject, html, userId, blogId, 'draft_scheduled', {
        blogTitle: blog.title,
        scheduledDate
      });
    } catch (error) {
      throw new Error(`Failed to send scheduled notification: ${error.message}`);
    }
  }

  async sendEmail(to, subject, html, userId, blogId = null, notificationType, metadata = {}) {
    try {
      const emailLog = new EmailLog({
        userId,
        email: to,
        blogId,
        subject,
        notificationType,
        status: 'pending',
        metadata
      });

      await emailLog.save();

      const mailOptions = {
        from: this.fromEmail,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);

      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      await emailLog.save();

      return { success: true, messageId: info.messageId };
    } catch (error) {
      const emailLog = await EmailLog.findOne({
        email: to,
        subject,
        status: 'pending'
      }).sort({ createdAt: -1 });

      if (emailLog) {
        emailLog.status = 'failed';
        emailLog.errorMessage = error.message;
        emailLog.attemptCount = (emailLog.attemptCount || 0) + 1;
        await emailLog.save();
      }

      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  getNewDraftTemplate(blog, user) {
    const blogUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/blog/${blog.slug}`;
    const editUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/edit/${blog._id}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .blog-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
          .blog-info strong { color: #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px 10px 0; }
          .button:hover { background: #764ba2; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 New Draft Created</h1>
          </div>

          <div class="content">
            <p>Hi ${user.name || 'there'},</p>

            <p>A new blog draft has been created and is ready for editing or publishing.</p>

            <div class="blog-info">
              <strong>Blog Title:</strong> ${blog.title}<br>
              <strong>Status:</strong> ${blog.status}<br>
              <strong>Created:</strong> ${new Date(blog.createdAt).toLocaleDateString()}<br>
              <strong>Category:</strong> ${blog.category || 'Uncategorized'}
            </div>

            <p>You can now:</p>
            <ul>
              <li>Edit and refine the content</li>
              <li>Add more details or media</li>
              <li>Schedule for future publishing</li>
              <li>Publish immediately</li>
            </ul>

            <a href="${editUrl}" class="button">Edit Draft</a>
            <a href="${blogUrl}" class="button">Preview</a>
          </div>

          <div class="footer">
            <p>You received this email because a new draft was created. You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPublishedTemplate(blog, user) {
    const blogUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/blog/${blog.slug}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; border-radius: 5px; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .blog-info { background: white; padding: 15px; border-left: 4px solid #38ef7d; margin: 15px 0; }
          .blog-info strong { color: #11998e; }
          .button { display: inline-block; background: #38ef7d; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px 10px 0; font-weight: bold; }
          .button:hover { background: #11998e; color: white; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Blog Published Successfully</h1>
          </div>

          <div class="content">
            <p>Hi ${user.name || 'there'},</p>

            <p>Your blog has been published and is now live!</p>

            <div class="blog-info">
              <strong>Blog Title:</strong> ${blog.title}<br>
              <strong>Status:</strong> Published<br>
              <strong>Published:</strong> ${new Date().toLocaleDateString()}<br>
              <strong>Category:</strong> ${blog.category || 'Uncategorized'}
            </div>

            <p>Your blog is now visible to readers. You can:</p>
            <ul>
              <li>Share on social media</li>
              <li>View analytics and engagement</li>
              <li>Update or modify content</li>
              <li>Invite readers to your blog</li>
            </ul>

            <a href="${blogUrl}" class="button">View Published Blog</a>
          </div>

          <div class="footer">
            <p>Congratulations on publishing your blog!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getScheduledTemplate(blog, user, scheduledDate) {
    const editUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/edit/${blog._id}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 5px; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .blog-info { background: white; padding: 15px; border-left: 4px solid #f5576c; margin: 15px 0; }
          .blog-info strong { color: #f5576c; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px 10px 0; }
          .button:hover { background: #f093fb; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Blog Scheduled for Publishing</h1>
          </div>

          <div class="content">
            <p>Hi ${user.name || 'there'},</p>

            <p>Your blog has been scheduled and will be published automatically at the specified time.</p>

            <div class="blog-info">
              <strong>Blog Title:</strong> ${blog.title}<br>
              <strong>Status:</strong> Scheduled<br>
              <strong>Publishing At:</strong> ${new Date(scheduledDate).toLocaleString()}<br>
              <strong>Category:</strong> ${blog.category || 'Uncategorized'}
            </div>

            <p>You can:</p>
            <ul>
              <li>Continue editing until scheduled time</li>
              <li>Reschedule for a different time</li>
              <li>Cancel the scheduling</li>
              <li>Preview the content</li>
            </ul>

            <a href="${editUrl}" class="button">Manage Schedule</a>
          </div>

          <div class="footer">
            <p>Your blog will be automatically published on the scheduled date.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendWeeklyDigest(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const preference = await EmailNotification.findOne({
        userId,
        notificationType: 'weekly_digest'
      });

      if (!preference || !preference.isEnabled) {
        return { skipped: true, reason: 'Digest disabled' };
      }

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const blogs = await Blog.find({
        author: userId,
        createdAt: { $gte: sevenDaysAgo }
      }).sort({ createdAt: -1 });

      const subject = `Weekly Digest - ${new Date().toLocaleDateString()}`;
      const html = this.getWeeklyDigestTemplate(user, blogs);

      return this.sendEmail(user.email, subject, html, userId, null, 'weekly_digest', {
        blogCount: blogs.length
      });
    } catch (error) {
      throw new Error(`Failed to send weekly digest: ${error.message}`);
    }
  }

  getWeeklyDigestTemplate(user, blogs) {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

    const blogsList = blogs.length > 0
      ? blogs.map(blog => `
        <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea;">
          <strong>${blog.title}</strong><br>
          <small style="color: #999;">Status: ${blog.status} | Created: ${new Date(blog.createdAt).toLocaleDateString()}</small>
        </div>
      `).join('')
      : '<p style="color: #999;">No new blogs this week</p>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
          .stat-card { background: white; padding: 15px; border-radius: 5px; text-align: center; }
          .stat-number { font-size: 28px; font-weight: bold; color: #667eea; }
          .stat-label { color: #999; font-size: 12px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px 10px 0; }
          .button:hover { background: #764ba2; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Weekly Digest</h1>
          </div>

          <div class="content">
            <p>Hi ${user.name || 'there'},</p>

            <p>Here's your weekly blogging summary:</p>

            <div class="stats">
              <div class="stat-card">
                <div class="stat-number">${blogs.length}</div>
                <div class="stat-label">New Blogs</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${blogs.filter(b => b.status === 'published').length}</div>
                <div class="stat-label">Published</div>
              </div>
            </div>

            <h3>Recent Blogs</h3>
            ${blogsList}

            <a href="${dashboardUrl}" class="button">View Dashboard</a>
          </div>

          <div class="footer">
            <p>This is your weekly digest. You can manage digest frequency in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async getEmailLogs(userId, limit = 20, skip = 0) {
    try {
      const logs = await EmailLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await EmailLog.countDocuments({ userId });

      return {
        logs: logs.map(l => l.toObject()),
        total,
        limit,
        skip
      };
    } catch (error) {
      throw new Error(`Failed to get email logs: ${error.message}`);
    }
  }

  async resendFailedEmails() {
    try {
      const failedEmails = await EmailLog.find({
        status: 'failed',
        attemptCount: { $lt: 3 },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      const results = [];

      for (const emailLog of failedEmails) {
        try {
          const mailOptions = {
            from: this.fromEmail,
            to: emailLog.email,
            subject: emailLog.subject,
            html: emailLog.metadata.html || ''
          };

          await this.transporter.sendMail(mailOptions);

          emailLog.status = 'sent';
          emailLog.sentAt = new Date();
          await emailLog.save();

          results.push({ id: emailLog._id, status: 'success' });
        } catch (error) {
          emailLog.attemptCount += 1;
          emailLog.errorMessage = error.message;
          await emailLog.save();

          results.push({ id: emailLog._id, status: 'failed', error: error.message });
        }
      }

      return { retried: results.length, results };
    } catch (error) {
      throw new Error(`Failed to resend failed emails: ${error.message}`);
    }
  }
}

module.exports = new EmailService();
