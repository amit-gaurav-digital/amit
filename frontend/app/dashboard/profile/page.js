'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Lock, Bell } from 'lucide-react';
import authAPI from '@/lib/auth-api';
import userAPI from '@/lib/user-api';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    name: '',
    department: ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailOnApproval: true,
    emailOnRejection: true,
    emailOnPublication: true,
    dailyDigest: false,
    weeklyReport: true
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setUser(userData);
        setProfileData({
          name: userData.name,
          department: userData.department || ''
        });
        setNotificationPrefs(userData.notificationPreferences || notificationPrefs);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await userAPI.updateUser(user._id, profileData);
      const updated = { ...user, ...profileData };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await authAPI.changePassword(passwordData.oldPassword, passwordData.newPassword);
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Password changed successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await userAPI.updateUser(user._id, { notificationPreferences: notificationPrefs });
      const updated = { ...user, notificationPreferences: notificationPrefs };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setSuccess('Notification preferences updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update preferences');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  if (!user) {
    return <div className="text-center py-8">User not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account settings</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="flex gap-6">
        <div className="w-48">
          <div className="bg-white rounded-lg shadow">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-6 py-4 border-b ${
                activeTab === 'profile' ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium">Profile</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('password')}
              className={`w-full text-left px-6 py-4 border-b ${
                activeTab === 'password' ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="font-medium">Password</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-6 py-4 ${
                activeTab === 'notifications' ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="font-medium">Notifications</span>
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-8">
            {activeTab === 'profile' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
                <form onSubmit={handleProfileUpdate}>
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                    <p className="text-sm text-gray-500 mt-2">Email cannot be changed</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Department</label>
                    <input
                      type="text"
                      value={profileData.department}
                      onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Role</label>
                    <input
                      type="text"
                      value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                    <p className="text-sm text-gray-500 mt-2">Contact administrator to change your role</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Member Since</label>
                    <input
                      type="text"
                      value={new Date(user.createdAt).toLocaleDateString()}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </form>
              </>
            )}

            {activeTab === 'password' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Change Password</h2>
                <form onSubmit={handlePasswordChange}>
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Must be at least 12 characters with uppercase, lowercase, numbers, and special characters
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Change Password
                  </button>
                </form>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>
                <form onSubmit={handleNotificationUpdate}>
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailOnApproval}
                        onChange={(e) => setNotificationPrefs({
                          ...notificationPrefs,
                          emailOnApproval: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Email on Approval</p>
                        <p className="text-sm text-gray-600">Get notified when your blog is approved</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailOnRejection}
                        onChange={(e) => setNotificationPrefs({
                          ...notificationPrefs,
                          emailOnRejection: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Email on Rejection</p>
                        <p className="text-sm text-gray-600">Get notified when your blog is rejected</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailOnPublication}
                        onChange={(e) => setNotificationPrefs({
                          ...notificationPrefs,
                          emailOnPublication: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Email on Publication</p>
                        <p className="text-sm text-gray-600">Get notified when your blog is published</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.dailyDigest}
                        onChange={(e) => setNotificationPrefs({
                          ...notificationPrefs,
                          dailyDigest: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Daily Digest</p>
                        <p className="text-sm text-gray-600">Get a summary of daily activities</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.weeklyReport}
                        onChange={(e) => setNotificationPrefs({
                          ...notificationPrefs,
                          weeklyReport: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Weekly Report</p>
                        <p className="text-sm text-gray-600">Get a weekly summary of all activities</p>
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Save Preferences
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
