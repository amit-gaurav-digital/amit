'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SearchConsoleWidget({ blogId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSCData();
  }, [blogId]);

  const fetchSCData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/search-console/${blogId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        setError(null);
      } else if (response.status === 404) {
        setError('Search Console not connected');
      }
    } catch (err) {
      setError('Failed to fetch SC data');
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
      <Link href="/dashboard/settings/integrations/search-console">
        <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-bold text-green-900 mb-2">🔍 Search Console</h3>
          <p className="text-green-800 text-sm">{error}</p>
          <p className="text-green-600 text-sm mt-2 font-medium">Click to connect →</p>
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
          <h3 className="text-lg font-bold text-gray-900">🔍 Search Console</h3>
          {data.lastSync && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {new Date(data.lastSync).toLocaleString()}
            </p>
          )}
        </div>
        <Link href="/dashboard/settings/integrations/search-console">
          <button className="text-green-600 hover:text-green-700 text-sm font-medium">
            Manage →
          </button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Total Clicks</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {data.summary?.totalClicks || 0}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Impressions</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {data.summary?.totalImpressions || 0}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Avg CTR</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {(data.summary?.averageCTR || 0).toFixed(2)}%
          </p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Avg Position</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            {(data.summary?.averagePosition || 0).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Top Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Queries */}
        {data.queries && data.queries.length > 0 && (
          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Top Search Queries</h4>
            <div className="space-y-2">
              {data.queries.slice(0, 3).map((query, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {query.query}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{query.clicks} clicks</span>
                    <span>{query.impressions} impressions</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span className="text-blue-600 font-medium">{query.ctr?.toFixed(2)}% CTR</span>
                    <span>Pos: {query.position?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Pages */}
        {data.pages && data.pages.length > 0 && (
          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Top Pages</h4>
            <div className="space-y-2">
              {data.pages.slice(0, 3).map((page, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {page.page}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{page.clicks} clicks</span>
                    <span>{page.impressions} impr</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span className="text-green-600 font-medium">{page.ctr?.toFixed(2)}%</span>
                    <span>Pos: {page.position?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
