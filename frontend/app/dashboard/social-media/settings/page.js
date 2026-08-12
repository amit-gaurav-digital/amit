'use client';

import { useState, useEffect } from 'react';
import { Link2, Unlink2, Settings, Bell, Clock, CheckCircle2 } from 'lucide-react';
import socialMediaAPI from '@/lib/socialMedia-api';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'from-blue-600 to-blue-400' },
  { id: 'facebook', name: 'Facebook', icon: '👍', color: 'from-blue-500 to-blue-300' },
  { id: 'instagram', name: 'Instagram', icon: '📷', color: 'from-pink-500 to-purple-400' },
  { id: 'threads', name: 'Threads', icon: '🧵', color: 'from-gray-700 to-gray-500' },
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', color: 'from-gray-900 to-gray-700' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', color: 'from-red-600 to-red-400' },
  { id: 'google_business', name: 'Google Business', icon: '🏢', color: 'from-yellow-500 to-orange-400' },
  { id: 'youtube', name: 'YouTube', icon: '📺', color: 'from-red-600 to-red-400' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'from-gray-900 to-pink-600' }
];

export default function SocialMediaSettingsPage() {
  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [preferences, setPreferences] = useState({
    timezone: 'America/New_York',
    maxDailyPosts: 3,
    autoPublish: true,
    approvalRequired: false,
    generateEmojis: true,
    dallEGeneration: true
  });
  const [notifications, setNotifications] = useState({
    telegram: 'chat_id_value',
    whatsapp: '+12345567890',
    slack: 'https://hooks.slack.com/services/...',
    email: 'approvals@aiming.solutions'
  });

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    setLoading(true);
    try {
      const accounts = await socialMediaAPI.getConnectedAccounts();
      const accountsMap = {};
      accounts.forEach(account => {
        accountsMap[account.platform] = account;
      });
      setConnectedAccounts(accountsMap);
      setError('');
    } catch (err) {
      console.error('Failed to load accounts:', err);
      setError('Failed to load connected accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPlatform = (platformId) => {
    setSuccessMessage(`${platformId} connection flow initiated (mock)`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDisconnectPlatform = async (platformId) => {
    if (!confirm(`Disconnect ${platformId}?`)) return;

    try {
      await socialMediaAPI.disconnectAccount(platformId);
      setConnectedAccounts(prev => {
        const updated = { ...prev };
        delete updated[platformId];
        return updated;
      });
      setSuccessMessage(`${platformId} disconnected successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`Failed to disconnect ${platformId}`);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = () => {
    setSuccessMessage('Preferences saved successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getPlatformStatus = (platformId) => {
    return connectedAccounts[platformId] ? 'CONNECTED' : 'NOT CONNECTED';
  };

  const getPlatformStatusColor = (platformId) => {
    return connectedAccounts[platformId]
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Role-Based Access Control Simulation</h1>
            <p className="text-gray-400 text-sm">Test Restrictions for Admin, Manager, Content Writer, or Viewer permissions.</p>
          </div>
          <div className="flex gap-3">
            {['Admin', 'Manager', 'Content Writer', 'Viewer'].map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedRole === role
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {role === 'Content Writer' ? 'Content Writer' : role}
              </button>
            ))}
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-900/20 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 rounded-lg bg-green-900/20 border border-green-500/20 text-green-400">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
            {/* Social Media Integration Profiles */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Social Media Integration Profiles</h2>
                  <p className="text-gray-400 text-sm mt-1">Connect, reconnect, or audit API channel tokens for this brand client.</p>
                </div>
                <div className="text-sm font-medium px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full border border-blue-700/30">
                  Aiming Solutions
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {PLATFORMS.map(platform => (
                  <div
                    key={platform.id}
                    className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-5 hover:border-gray-600/50 transition-all hover:shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{platform.icon}</div>
                        <div>
                          <h3 className="font-bold text-white">{platform.name}</h3>
                          <p className={`text-xs font-medium px-2 py-1 rounded-full mt-1 ${getPlatformStatusColor(
                            platform.id
                          )}`}>
                            {getPlatformStatus(platform.id)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Account Info or Connect Button */}
                    {connectedAccounts[platform.id] ? (
                      <div className="space-y-3 mb-4">
                        <div className="text-sm">
                          <span className="text-gray-400">Account: </span>
                          <span className="text-gray-200 font-medium">
                            @{connectedAccounts[platform.id].accountName}
                          </span>
                        </div>
                        {connectedAccounts[platform.id].followers > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-400">Followers: </span>
                            <span className="text-gray-200 font-medium">
                              {connectedAccounts[platform.id].followers.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Connected
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm mb-4">Not yet connected to this platform</p>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        if (connectedAccounts[platform.id]) {
                          handleDisconnectPlatform(platform.id);
                        } else {
                          handleConnectPlatform(platform.id);
                        }
                      }}
                      className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        connectedAccounts[platform.id]
                          ? 'bg-red-900/30 text-red-400 border border-red-700/30 hover:bg-red-900/50'
                          : 'bg-blue-900/30 text-blue-400 border border-blue-700/30 hover:bg-blue-900/50'
                      }`}
                    >
                      {connectedAccounts[platform.id] ? (
                        <>
                          <Unlink2 className="w-4 h-4" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" />
                          Connect Platform Profile
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Preferences */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Publishing Preferences</h3>
              </div>
              <p className="text-gray-400 text-xs mb-4">Configure default calendar zones and auto-approve variables.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Timezone</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option>America/New_York (EST)</option>
                    <option>America/Chicago (CST)</option>
                    <option>America/Denver (MST)</option>
                    <option>America/Los_Angeles (PST)</option>
                    <option>Europe/London (GMT)</option>
                    <option>Europe/Paris (CET)</option>
                    <option>Asia/Tokyo (JST)</option>
                    <option>Australia/Sydney (AEDT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Time</label>
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Daily Posts</label>
                  <input
                    type="number"
                    value={preferences.maxDailyPosts}
                    onChange={(e) => handlePreferenceChange('maxDailyPosts', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    min="1"
                    max="10"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.autoPublish}
                      onChange={(e) => handlePreferenceChange('autoPublish', e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">Auto Publish Scheduled Posts</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.approvalRequired}
                      onChange={(e) => handlePreferenceChange('approvalRequired', e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">Approval Required for Campaigns</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.generateEmojis}
                      onChange={(e) => handlePreferenceChange('generateEmojis', e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">Generate Emojis & Hashtags</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.dallEGeneration}
                      onChange={(e) => handlePreferenceChange('dallEGeneration', e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">DALL-E Visual Generation</span>
                  </label>
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all text-sm"
                >
                  Save Preferences
                </button>
              </div>
            </div>

            {/* Approval Notifications */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Approval Notifications</h3>
              </div>
              <p className="text-gray-400 text-xs mb-4">Route post warnings directly to Slack, Telegram, WhatsApp, or Email.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telegram Destination</label>
                  <input
                    type="text"
                    value={notifications.telegram}
                    onChange={(e) => handleNotificationChange('telegram', e.target.value)}
                    placeholder="chat_id_value"
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp Destination</label>
                  <input
                    type="text"
                    value={notifications.whatsapp}
                    onChange={(e) => handleNotificationChange('whatsapp', e.target.value)}
                    placeholder="+12345567890"
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Slack Destination</label>
                  <input
                    type="text"
                    value={notifications.slack}
                    onChange={(e) => handleNotificationChange('slack', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Destination</label>
                  <input
                    type="email"
                    value={notifications.email}
                    onChange={(e) => handleNotificationChange('email', e.target.value)}
                    placeholder="approvals@aiming.solutions"
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="w-full mt-4 py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-all text-sm"
                >
                  Save Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
