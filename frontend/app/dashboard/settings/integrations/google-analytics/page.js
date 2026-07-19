'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function GoogleAnalyticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState([]);
  const [error, setError] = useState(null);
  const [oauthCode, setOauthCode] = useState(null);
  const [propertyIdInput, setPropertyIdInput] = useState('');
  const [configuringProperty, setConfiguringProperty] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchBlogs();

    // Extract OAuth code from URL
    const code = searchParams.get('code');
    console.log('Initial setup: OAuth code from URL:', code ? code.substring(0, 20) + '...' : 'NOT FOUND');
    if (code) {
      console.log('Setting oauthCode state');
      setOauthCode(code);
    } else {
      console.log('No OAuth code in URL');
    }
  }, []);

  useEffect(() => {
    console.log('selectedBlog changed:', selectedBlog ? selectedBlog._id : 'null');
    if (selectedBlog) {
      fetchIntegrationStatus(selectedBlog._id);
    }
  }, [selectedBlog]);

  // Handle OAuth callback when both code and blog are ready
  useEffect(() => {
    console.log('OAuth Effect: Checking conditions', {
      oauthCode: !!oauthCode,
      selectedBlog: !!selectedBlog,
      blogId: selectedBlog?._id
    });

    if (oauthCode && selectedBlog) {
      console.log('OAuth Effect: Both code and blog ready, calling handleOAuthCallback');
      handleOAuthCallback(oauthCode);
    }
  }, [oauthCode, selectedBlog]);

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
      console.log('Fetching integration status for blog:', blogId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/status/${blogId}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      console.log('Status fetch response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Integration status data:', data);
        setIntegrationStatus(data);
      } else {
        console.error('Status fetch failed with status:', response.status);
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
    console.log('handleOAuthCallback called with code:', code?.substring(0, 20) + '...');
    console.log('selectedBlog check:', selectedBlog ? 'Blog loaded' : 'Blog NOT loaded');

    if (!selectedBlog) {
      console.log('No selectedBlog, returning early');
      return;
    }

    try {
      console.log('Processing OAuth callback with code:', code?.substring(0, 20) + '...');
      console.log('Selected blog ID:', selectedBlog._id);
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

      const url = `${process.env.NEXT_PUBLIC_API_URL}/integrations/google-analytics/connect/${selectedBlog._id}`;
      console.log('Making POST request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      console.log('POST request completed, status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('OAuth response data:', data);
      } catch (parseErr) {
        console.error('Failed to parse response JSON:', parseErr);
        data = { error: 'Invalid response format' };
      }

      if (response.ok) {
        console.log('OAuth connection successful, fetching status...');
        setError(null);
        // Delay status fetch to ensure backend has updated
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchIntegrationStatus(selectedBlog._id);
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('OAuth process complete');
      } else {
        const errorMsg = `Failed to connect: ${data.error || 'Unknown error'} (Status: ${response.status})`;
        console.error('OAuth connection failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('OAuth callback error:', err);
      setError(`OAuth callback failed: ${err.message}`);
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

  const handleConfigureProperty = async () => {
    if (!selectedBlog || !propertyIdInput.trim()) {
      setError('Please enter a valid Property ID');
      return;
    }

    setConfiguringProperty(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/google-analytics/configure-property/${selectedBlog._id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ propertyId: propertyIdInput.trim() })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setError(null);
        setPropertyIdInput('');
        await fetchIntegrationStatus(selectedBlog._id);
      } else {
        setError(`Failed to configure property: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Configuration failed: ${err.message}`);
    } finally {
      setConfiguringProperty(false);
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Select Blog
          </label>
          {blogs.length > 0 ? (
            <select
              value={selectedBlog?._id || ''}
              onChange={(e) => {
                const blog = blogs.find(b => b._id === e.target.value);
                setSelectedBlog(blog);
              }}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
              style={{
                color: '#111827',
                backgroundColor: '#ffffff',
                fontSize: '16px'
              }}
            >
              <option value="" style={{ color: '#6b7280' }}>-- Select a blog --</option>
              {blogs.map(blog => (
                <option
                  key={blog._id}
                  value={blog._id}
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                >
                  {blog.title || blog.name || `Blog ${blog._id?.substring(0, 8)}`}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800 font-medium">
                📝 No blogs found
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Create a blog first from the <Link href="/dashboard/blogs/create" className="font-semibold underline">Blogs section</Link>
              </p>
            </div>
          )}
        </div>

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

                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Property:</span> {integrationStatus.googleAnalytics.propertyName}</p>
                  <p><span className="font-medium">Property ID:</span> {integrationStatus.googleAnalytics.propertyId || '—'}</p>
                  {integrationStatus.googleAnalytics.lastSync && (
                    <p>
                      <span className="font-medium">Last Sync:</span>{' '}
                      {new Date(integrationStatus.googleAnalytics.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>

                {integrationStatus.googleAnalytics.propertyName?.includes('Not Yet Configured') && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium mb-3">
                      Enter your Google Analytics 4 Property ID to start syncing data
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={propertyIdInput}
                        onChange={(e) => setPropertyIdInput(e.target.value)}
                        placeholder="e.g., 542354645"
                        className="flex-1 px-3 py-2 border border-yellow-300 rounded text-gray-900"
                      />
                      <button
                        onClick={handleConfigureProperty}
                        disabled={configuringProperty}
                        className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-colors"
                      >
                        {configuringProperty ? 'Saving...' : 'Save Property'}
                      </button>
                    </div>
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

export default function GoogleAnalyticsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>}>
      <GoogleAnalyticsContent />
    </Suspense>
  );
}
