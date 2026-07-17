'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function GoogleAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchBlogs();

    // Check for OAuth callback
    const code = searchParams.get('code');
    if (code) {
      handleOAuthCallback(code);
    }
  }, []);

  useEffect(() => {
    if (selectedBlog) {
      fetchIntegrationStatus(selectedBlog._id);
    }
  }, [selectedBlog]);

  const fetchBlogs = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs || []);
        if (data.blogs && data.blogs.length > 0) {
          setSelectedBlog(data.blogs[0]);
        }
      }
    } catch (err) {
      setError('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrationStatus = async (blogId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/status/${blogId}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setIntegrationStatus(data);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const fetchSyncHistory = async (blogId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/google-analytics/sync-history/${blogId}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSyncHistory(data.syncHistory || []);
      }
    } catch (err) {
      console.error('Error fetching sync history:', err);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/google-analytics/auth-url`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setError('Failed to initiate connection');
    }
  };

  const handleOAuthCallback = async (code) => {
    if (!selectedBlog) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/google-analytics/connect/${selectedBlog._id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        }
      );

      if (response.ok) {
        setError(null);
        fetchIntegrationStatus(selectedBlog._id);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setError('Failed to connect Google Analytics');
      }
    } catch (err) {
      setError('OAuth callback failed');
    }
  };

  const handleDisconnect = async () => {
    if (!selectedBlog || !window.confirm('Are you sure? This will stop syncing Google Analytics data.')) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/google-analytics/disconnect/${selectedBlog._id}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.ok) {
        setIntegrationStatus(null);
        setError(null);
      }
    } catch (err) {
      setError('Failed to disconnect');
    }
  };

  const handleManualSync = async () => {
    if (!selectedBlog) return;

    setSyncing(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/google-analytics/sync/${selectedBlog._id}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.ok) {
        fetchIntegrationStatus(selectedBlog._id);
        fetchSyncHistory(selectedBlog._id);
        setError(null);
      }
    } catch (err) {
      setError('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/settings" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Settings
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">Google Analytics</h1>
            {integrationStatus?.googleAnalytics?.connected && (
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                ✓ Connected
              </span>
            )}
          </div>
          <p className="text-gray-600">Connect and manage your Google Analytics integration</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Blog Selection */}
        {blogs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Blog
            </label>
            <select
              value={selectedBlog?._id || ''}
              onChange={(e) => {
                const blog = blogs.find(b => b._id === e.target.value);
                setSelectedBlog(blog);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {blogs.map(blog => (
                <option key={blog._id} value={blog._id}>
                  {blog.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Connection Status</h2>

          {integrationStatus?.googleAnalytics?.connected ? (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="font-medium text-gray-900">Connected</span>
                </div>

                {integrationStatus.googleAnalytics.propertyName && (
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Property:</span> {integrationStatus.googleAnalytics.propertyName}</p>
                    <p><span className="font-medium">Property ID:</span> {integrationStatus.googleAnalytics.propertyId}</p>
                    {integrationStatus.googleAnalytics.lastSync && (
                      <p>
                        <span className="font-medium">Last Sync:</span>{' '}
                        {new Date(integrationStatus.googleAnalytics.lastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {syncing ? '⟳ Syncing...' : '⟳ Sync Now'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-gray-600 mb-4">Not connected</p>
              <button
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Connect Google Analytics
              </button>
            </div>
          )}
        </div>

        {/* Sync History */}
        {integrationStatus?.googleAnalytics?.connected && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sync History</h2>
            {syncHistory.length > 0 ? (
              <div className="space-y-3">
                {syncHistory.map((sync, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-red-600">{sync.error}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(sync.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sync history yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
