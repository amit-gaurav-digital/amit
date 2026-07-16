const express = require('express');
const authorizationService = require('../services/authorization');
const emailService = require('../services/emailService');

const router = express.Router();

router.use(authorizationService.requireAuth);

router.get('/preferences', async (req, res) => {
  try {
    const preferences = await emailService.getNotificationPreferences(req.user.userId);
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/preferences/:notificationType', async (req, res) => {
  try {
    const { notificationType } = req.params;
    const { frequency, isEnabled } = req.body;

    const validTypes = ['new_draft', 'draft_published', 'draft_scheduled', 'comment_reply', 'blog_update', 'weekly_digest'];
    if (!validTypes.includes(notificationType)) {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    const validFrequencies = ['immediate', 'daily', 'weekly', 'never'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({ error: 'Invalid frequency' });
    }

    const preference = await emailService.updateNotificationPreference(
      req.user.userId,
      notificationType,
      frequency,
      isEnabled !== false
    );

    res.json(preference);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const emailLogs = await emailService.getEmailLogs(
      req.user.userId,
      Math.min(parseInt(limit), 100),
      parseInt(skip)
    );

    res.json(emailLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/resend-failed', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const result = await emailService.resendFailedEmails();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { email, subject } = req.body;

    if (!email || !subject) {
      return res.status(400).json({ error: 'Email and subject are required' });
    }

    const testHtml = `
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Test Email</h2>
        <p>This is a test email to verify your email notification settings.</p>
        <p>If you received this, your email configuration is working correctly.</p>
      </body>
      </html>
    `;

    await emailService.sendEmail(email, subject || 'Test Email', testHtml, req.user.userId, null, 'test_email');

    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
