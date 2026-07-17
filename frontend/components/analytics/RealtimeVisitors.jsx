'use client';

import { useEffect, useState } from 'react';

export default function RealtimeVisitors({ blogId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [blogId]);

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/realtime/${blogId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        setError(null);
        setLastUpdate(new Date());
      } else if (response.status !== 404) {
        setError('Failed to fetch realtime data');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Realtime Data</h3>
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">👥 Active Users Right Now</h3>
          <p className="text-xs text-gray-500 mt-1">
            Updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-600 font-medium">Live</span>
        </div>
      </div>

      {/* Main User Count */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6 border border-green-200">
        <p className="text-sm text-gray-600 mb-2">Current Active Users</p>
        <p className="text-5xl font-bold text-green-600">
          {data.activeUsers || 0}
        </p>
      </div>

      {/* Top Pages Right Now */}
      {data.topPages && data.topPages.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-gray-900 mb-3 text-sm">Pages Right Now</h4>
          <div className="space-y-2">
            {data.topPages.slice(0, 4).map((page, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {page.pagePath}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-6 bg-blue-200 rounded" style={{ width: `${(page.activeUsers / (data.topPages[0]?.activeUsers || 1)) * 80}px` }}></div>
                  <span className="text-sm font-bold text-blue-600 min-w-12 text-right">
                    {page.activeUsers}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Sources */}
      {data.topSources && data.topSources.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-gray-900 mb-3 text-sm">Traffic Sources</h4>
          <div className="space-y-2">
            {data.topSources.slice(0, 3).map((source, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-3">
                <span className="text-sm text-gray-900">{source.source}</span>
                <span className="text-sm font-bold text-purple-600">
                  {source.activeUsers}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Countries */}
      {data.topCountries && data.topCountries.length > 0 && (
        <div>
          <h4 className="font-bold text-gray-900 mb-3 text-sm">Top Countries</h4>
          <div className="space-y-2">
            {data.topCountries.slice(0, 3).map((country, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-3">
                <span className="text-sm text-gray-900">{country.country}</span>
                <span className="text-sm font-bold text-orange-600">
                  {country.activeUsers}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-refresh notice */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          🔄 Auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}
