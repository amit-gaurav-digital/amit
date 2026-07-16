'use client';

import { useState, useEffect } from 'react';
import { Mail, Bell, Check, AlertCircle, Send, RefreshCw } from 'lucide-react';
import emailNotificationsAPI from '@/lib/emailNotifications-api';

export default function EmailNotificationsPage() {
  const [preferences, setPreferences] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Test Email from Blogging Platform');
  const [sendingTest, setSendingTest] = useState(false);
  const [logsPage, setLogsPage] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);

  const notificationTypes = [
    { id: 'new_draft', label: 'New Draft Created', icon: '📝', description: 'Get notified when a new draft is created' },
    { id: 'draft_published', label: 'Blog Published', icon: '🚀', description: 'Get notified when a blog is published' },
    { id: 'draft_scheduled', label: 'Blog Scheduled', icon: '⏰', description: 'Get notified when a blog is scheduled' },
    { id: 'comment_reply', label: 'New Comments', icon: '💬', description: 'Get notified when someone comments on your blog' },
    { id: 'blog_update', label: 'Blog Updates', icon: '✏️', description: 'Get notified about important blog updates' },
    { id: 'weekly_digest', label: 'Weekly Digest', icon: '📊', description: 'Receive a weekly summary of your blogging activity' }
  ];

  useEffect(() => {
    loadPreferences();
    loadEmailLogs();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [preferences]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const prefs = await emailNotificationsAPI.getNotificationPreferences();
      const mergedPrefs = notificationTypes.map(type => {
        const existing = prefs.find(p => p.notificationType === type.id);
        return existing || {
          notificationType: type.id,
          isEnabled: true,
          frequency: 'immediate'
        };
      });
      setPreferences(mergedPrefs);
      setError('');
    } catch (err) {
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const loadEmailLogs = async (page = 0) => {
    try {
      const result = await emailNotificationsAPI.getEmailLogs(20, page * 20);
      setEmailLogs(result.logs);
      setTotalLogs(result.total);
      setLogsPage(page);
    } catch (err) {
      console.error('Failed to load email logs');
    }
  };

  const calculateStats = () => {
    const enabledCount = preferences.filter(p => p.isEnabled).length;
    const immediateCount = preferences.filter(p => p.isEnabled && p.frequency === 'immediate').length;

    setStats({
      enabledNotifications: enabledCount,
      immediateNotifications: immediateCount,
      totalNotificationTypes: preferences.length
    });
  };

  const handlePreferenceChange = async (notificationType, field, value) => {
    try {
      const pref = preferences.find(p => p.notificationType === notificationType);
      const updatedPref = { ...pref, [field]: value };

      await emailNotificationsAPI.updateNotificationPreference(
        notificationType,
        updatedPref.frequency,
        updatedPref.isEnabled
      );

      setPreferences(preferences.map(p =>
        p.notificationType === notificationType ? updatedPref : p
      ));

      setSuccessMessage('Preference updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update preference');
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setError('Please enter an email address');
      return;
    }

    setSendingTest(true);
    try {
      await emailNotificationsAPI.sendTestEmail(testEmail, testSubject);
      setSuccessMessage('Test email sent successfully');
      setShowTestModal(false);
      setTestEmail('');
      setTestSubject('Test Email from Blogging Platform');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  const handleResendFailed = async () => {
    if (confirm('Resend all failed emails from the last 24 hours?')) {
      try {
        const result = await emailNotificationsAPI.resendFailedEmails();
        setSuccessMessage(`${result.retried} emails re-sent`);
        await loadEmailLogs();
      } catch (err) {
        setError('Failed to resend emails');
      }
    }
  };

  const getNotificationTypeLabel = (id) => {
    return notificationTypes.find(t => t.id === id)?.label || id;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Mail className="w-4 h-4 text-yellow-600" />;
      default:
        return <Mail className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Notifications</h1>
        <p className="text-gray-600 mt-2">Manage your email notification preferences and view email logs</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded border bg-red-50 border-red-200 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 rounded border bg-green-50 border-green-200 text-green-700 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">✕</button>
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Enabled Notifications</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.enabledNotifications}/{stats.totalNotificationTypes}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Immediate Alerts</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.immediateNotifications}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Total Emails Logged</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{totalLogs}</div>
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading preferences...</div>
        ) : (
          <div className="divide-y">
            {preferences.map(pref => {
              const notifType = notificationTypes.find(t => t.id === pref.notificationType);
              return (
                <div key={pref.notificationType} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{notifType?.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{notifType?.label}</h3>
                        <p className="text-gray-600 text-sm mt-1">{notifType?.description}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.isEnabled}
                        onChange={(e) => handlePreferenceChange(pref.notificationType, 'isEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {pref.isEnabled && (
                    <div className="ml-12">
                      <label className="block text-gray-700 font-medium text-sm mb-2">Frequency</label>
                      <select
                        value={pref.frequency}
                        onChange={(e) => handlePreferenceChange(pref.notificationType, 'frequency', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="daily">Daily Digest</option>
                        <option value="weekly">Weekly Digest</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Test & Debug Section */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Email Testing</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowTestModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
          >
            <Send className="w-5 h-5" />
            Send Test Email
          </button>

          <button
            onClick={handleResendFailed}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Resend Failed Emails
          </button>
        </div>
      </div>

      {/* Email Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Email Logs</h2>
        </div>

        {emailLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>No email logs yet</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sent Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {emailLogs.map(log => (
                    <tr key={log._id} className={`${getStatusColor(log.status)}`}>
                      <td className="px-6 py-4 text-sm font-medium">{log.subject}</td>
                      <td className="px-6 py-4 text-sm capitalize">{log.notificationType.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span>{log.status.charAt(0).toUpperCase() + log.status.slice(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {log.sentAt ? new Date(log.sentAt).toLocaleDateString() : new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {Math.min(logsPage * 20 + 1, totalLogs)} - {Math.min((logsPage + 1) * 20, totalLogs)} of {totalLogs}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadEmailLogs(logsPage - 1)}
                  disabled={logsPage === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadEmailLogs(logsPage + 1)}
                  disabled={(logsPage + 1) * 20 >= totalLogs}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Send Test Email</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email Subject</label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testEmail}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {sendingTest ? 'Sending...' : 'Send Test Email'}
              </button>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestEmail('');
                  setTestSubject('Test Email from Blogging Platform');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
