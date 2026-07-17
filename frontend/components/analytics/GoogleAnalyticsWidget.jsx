'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function GoogleAnalyticsWidget({ blogId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGAData();
  }, [blogId]);

  const fetchGAData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/google-analytics/${blogId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        setError(null);
      } else if (response.status === 404) {
        setError('Google Analytics not connected');
      }
    } catch (err) {
      setError('Failed to fetch GA data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Link href="/dashboard/settings/integrations/google-analytics">
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-bold text-blue-900 mb-2">📊 Google Analytics</h3>
          <p className="text-blue-800 text-sm">{error}</p>
          <p className="text-blue-600 text-sm mt-2 font-medium">Click to connect →</p>
        </div>
      </Link>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">📊 Google Analytics</h3>
          {data.lastSync && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {new Date(data.lastSync).toLocaleString()}
            </p>
          )}
        </div>
        <Link href="/dashboard/settings/integrations/google-analytics">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Manage →
          </button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Active Users (Today)</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {data.realtime?.activeUsers || 0}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Page Views</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {data.daily?.screenPageViews || 0}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Sessions</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {data.daily?.sessions || 0}
          </p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Bounce Rate</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            {(data.daily?.bounceRate || 0).toFixed(1)}%
          </p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Avg Session Duration</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            {formatDuration(data.daily?.averageSessionDuration || 0)}
          </p>
        </div>

        <div className="bg-pink-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Conversion Rate</p>
          <p className="text-2xl font-bold text-pink-600 mt-2">
            {(data.daily?.conversionRate || 0).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Top Pages */}
      {data.topPages && data.topPages.length > 0 && (
        <div>
          <h4 className="font-bold text-gray-900 mb-3 text-sm">Top Pages</h4>
          <div className="space-y-2">
            {data.topPages.slice(0, 3).map((page, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {page.pagePath}
                  </p>
                  <p className="text-xs text-gray-500">
                    {page.pageViews} views • {page.users} users
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">
                    {(page.bounceRate || 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">bounce</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
}
