'use client';

import { useState, useEffect } from 'react';
import { Share2, Twitter, Facebook, Instagram, Trash2, Link2, Unlink2, Copy, Check } from 'lucide-react';
import socialMediaAPI from '@/lib/socialMedia-api';
import blogAPI from '@/lib/api';

export default function SocialMediaPage() {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [posting, setPosting] = useState(false);
  const [customContent, setCustomContent] = useState({
    title: '',
    description: '',
    hashtags: ''
  });
  const [scheduledTime, setScheduledTime] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadBlogs();
    loadAccounts();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedBlog) {
      loadSocialPosts();
    }
  }, [selectedBlog]);

  const loadBlogs = async () => {
    try {
      const response = await blogAPI.getBlogs(50, 0);
      setBlogs(response.blogs);
      if (response.blogs.length > 0) {
        setSelectedBlog(response.blogs[0]._id);
      }
    } catch (err) {
      setError('Failed to load blogs');
    }
  };

  const loadAccounts = async () => {
    try {
      const accs = await socialMediaAPI.getConnectedAccounts();
      setAccounts(accs);
      setError('');
    } catch (err) {
      setError('Failed to load accounts');
    }
  };

  const loadStats = async () => {
    try {
      const s = await socialMediaAPI.getUserSocialStats();
      setStats(s);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const loadSocialPosts = async () => {
    setLoading(true);
    try {
      const posts = await socialMediaAPI.getSocialMediaPosts(selectedBlog);
      setSocialPosts(posts);
      setError('');
    } catch (err) {
      setError('Failed to load social posts');
    } finally {
      setLoading(false);
    }
  };

  const handleShareNow = async () => {
    if (selectedPlatforms.length === 0) {
      setError('Select at least one platform');
      return;
    }

    setPosting(true);
    try {
      const hashtags = customContent.hashtags
        .split(',')
        .map(h => h.trim())
        .filter(h => h);

      const result = await socialMediaAPI.postToSocialMedia(selectedBlog, selectedPlatforms, {
        title: customContent.title,
        description: customContent.description,
        hashtags
      });

      setSuccessMessage(`Posted to ${result.results.filter(r => r.status === 'success').length} platforms`);
      setShowShareModal(false);
      setSelectedPlatforms([]);
      setCustomContent({ title: '', description: '', hashtags: '' });
      await loadSocialPosts();
      await loadStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleSchedulePost = async () => {
    if (selectedPlatforms.length === 0) {
      setError('Select at least one platform');
      return;
    }

    if (!scheduledTime) {
      setError('Select a scheduled time');
      return;
    }

    setPosting(true);
    try {
      const hashtags = customContent.hashtags
        .split(',')
        .map(h => h.trim())
        .filter(h => h);

      await socialMediaAPI.schedulePost(selectedBlog, selectedPlatforms, scheduledTime, {
        title: customContent.title,
        description: customContent.description,
        hashtags
      });

      setSuccessMessage('Post scheduled successfully');
      setShowScheduleModal(false);
      setSelectedPlatforms([]);
      setCustomContent({ title: '', description: '', hashtags: '' });
      setScheduledTime('');
      await loadSocialPosts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to schedule post');
    } finally {
      setPosting(false);
    }
  };

  const handleRefreshMetrics = async (postId) => {
    try {
      await socialMediaAPI.refreshEngagementMetrics(postId);
      await loadSocialPosts();
      setSuccessMessage('Metrics updated');
    } catch (err) {
      setError('Failed to refresh metrics');
    }
  };

  const handleDisconnectAccount = async (platform) => {
    if (confirm(`Disconnect ${platform}?`)) {
      try {
        await socialMediaAPI.disconnectAccount(platform);
        await loadAccounts();
        setSuccessMessage(`${platform} disconnected`);
      } catch (err) {
        setError('Failed to disconnect account');
      }
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'twitter':
        return 'bg-blue-50 border-blue-200';
      case 'facebook':
        return 'bg-blue-50 border-blue-200';
      case 'instagram':
        return 'bg-pink-50 border-pink-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Social Media Integration</h1>
        <p className="text-gray-600 mt-2">Share and manage blog posts across social platforms</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded border bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 rounded border bg-green-50 border-green-200 text-green-700 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">
            ✕
          </button>
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Connected Accounts</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAccounts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Total Posts</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPosts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Successful Posts</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.successfulPosts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Total Engagement</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEngagement}</div>
          </div>
        </div>
      )}

      {/* Connected Accounts */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Connected Accounts</h2>

        {accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>No accounts connected yet</p>
            <p className="text-sm">Connect your social media accounts to start sharing</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {accounts.map(account => (
              <div key={`${account.platform}-${account.accountId}`} className={`border rounded-lg p-4 flex items-center justify-between ${getPlatformColor(account.platform)}`}>
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getPlatformIcon(account.platform)}</div>
                  <div>
                    <div className="font-medium text-gray-900 capitalize">{account.platform}</div>
                    <div className="text-sm text-gray-600">@{account.accountName}</div>
                    <div className="text-xs text-gray-500 mt-1">{account.followers.toLocaleString()} followers</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnectAccount(account.platform)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
                >
                  <Unlink2 className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blog Selector and Share Actions */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Share Blog Post</h2>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Select Blog</label>
          <select
            value={selectedBlog}
            onChange={(e) => setSelectedBlog(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {blogs.map(blog => (
              <option key={blog._id} value={blog._id}>
                {blog.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              setSelectedPlatforms([]);
              setShowShareModal(true);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Now
          </button>
          <button
            onClick={() => {
              setSelectedPlatforms([]);
              setShowScheduleModal(true);
            }}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Schedule Post
          </button>
        </div>
      </div>

      {/* Social Posts History */}
      {loading ? (
        <div className="text-center py-8">Loading posts...</div>
      ) : socialPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No social posts yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Post History</h2>
          {socialPosts.map(post => (
            <div key={post._id} className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{post.content.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{post.content.description}</p>
              </div>

              <div className="grid gap-4">
                {post.platforms.map((platform, idx) => (
                  <div key={idx} className={`border rounded-lg p-4 ${getPlatformColor(platform.platform)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getPlatformIcon(platform.platform)}
                        <div>
                          <div className="font-medium text-gray-900 capitalize">{platform.platform}</div>
                          <div className={`text-xs font-medium mt-1 px-2 py-1 rounded-full ${
                            platform.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : platform.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {platform.status.charAt(0).toUpperCase() + platform.status.slice(1)}
                          </div>
                        </div>
                      </div>
                      {platform.url && (
                        <button
                          onClick={() => copyToClipboard(platform.url, platform.postId)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Copy URL"
                        >
                          {copiedId === platform.postId ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {platform.errorMessage && (
                      <div className="text-sm text-red-700 mb-3">{platform.errorMessage}</div>
                    )}

                    {platform.status === 'success' && (
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <div className="text-gray-600">Likes</div>
                          <div className="font-semibold text-gray-900">{platform.engagement.likes}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Comments</div>
                          <div className="font-semibold text-gray-900">{platform.engagement.comments}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Shares</div>
                          <div className="font-semibold text-gray-900">{platform.engagement.shares}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Views</div>
                          <div className="font-semibold text-gray-900">{platform.engagement.views}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                Posted on {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Now Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Share Blog Now</h2>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-3">Select Platforms</label>
              <div className="space-y-2">
                {['twitter', 'facebook', 'instagram'].map(platform => (
                  <label key={platform} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, platform]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 capitalize font-medium text-gray-900">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Custom Title (Optional)</label>
                <input
                  type="text"
                  value={customContent.title}
                  onChange={(e) => setCustomContent({ ...customContent, title: e.target.value })}
                  placeholder="Leave empty to use blog title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Custom Description (Optional)</label>
                <textarea
                  value={customContent.description}
                  onChange={(e) => setCustomContent({ ...customContent, description: e.target.value })}
                  placeholder="Leave empty to use blog excerpt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Hashtags (Comma-separated, Optional)</label>
                <input
                  type="text"
                  value={customContent.hashtags}
                  onChange={(e) => setCustomContent({ ...customContent, hashtags: e.target.value })}
                  placeholder="e.g., blogging,tech,writing"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleShareNow}
                disabled={posting || selectedPlatforms.length === 0}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {posting ? 'Sharing...' : 'Share Now'}
              </button>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedPlatforms([]);
                  setCustomContent({ title: '', description: '', hashtags: '' });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Post Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Schedule Post</h2>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-3">Select Platforms</label>
              <div className="space-y-2">
                {['twitter', 'facebook', 'instagram'].map(platform => (
                  <label key={platform} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, platform]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 capitalize font-medium text-gray-900">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Schedule Time</label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Custom Title (Optional)</label>
                <input
                  type="text"
                  value={customContent.title}
                  onChange={(e) => setCustomContent({ ...customContent, title: e.target.value })}
                  placeholder="Leave empty to use blog title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Custom Description (Optional)</label>
                <textarea
                  value={customContent.description}
                  onChange={(e) => setCustomContent({ ...customContent, description: e.target.value })}
                  placeholder="Leave empty to use blog excerpt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Hashtags (Comma-separated, Optional)</label>
                <input
                  type="text"
                  value={customContent.hashtags}
                  onChange={(e) => setCustomContent({ ...customContent, hashtags: e.target.value })}
                  placeholder="e.g., blogging,tech,writing"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSchedulePost}
                disabled={posting || selectedPlatforms.length === 0 || !scheduledTime}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {posting ? 'Scheduling...' : 'Schedule'}
              </button>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedPlatforms([]);
                  setCustomContent({ title: '', description: '', hashtags: '' });
                  setScheduledTime('');
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
