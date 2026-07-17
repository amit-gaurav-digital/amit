'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import GoogleAnalyticsWidget from '@/components/analytics/GoogleAnalyticsWidget';
import SearchConsoleWidget from '@/components/analytics/SearchConsoleWidget';
import RealtimeVisitors from '@/components/analytics/RealtimeVisitors';
import SEOMetrics from '@/components/analytics/SEOMetrics';
import KeywordRankings from '@/components/analytics/KeywordRankings';
import TrafficSources from '@/components/analytics/TrafficSources';

export default function BlogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.blogId;

  const [activeTab, setActiveTab] = useState('overview');
  const [blogData, setBlogData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      router.push('/login');
      return;
    }
    setToken(authToken);

    if (blogId) {
      fetchBlogData(blogId, authToken);
      fetchAnalytics(blogId, dateRange, authToken);
    }
  }, [blogId, router]);

  const fetchBlogData = async (id, authToken) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBlogData(data);
      }
    } catch (err) {
      setError('Failed to fetch blog data');
    }
  };

  const fetchAnalytics = async (id, days, authToken) => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/dashboard/${id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (days) => {
    setDateRange(days);
    if (token) {
      fetchAnalytics(blogId, days, token);
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'analytics', label: '📈 Google Analytics', icon: '📈' },
    { id: 'seo', label: '🔍 Search Console', icon: '🔍' }
  ];

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <p>Loading blog details...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '30px' }}>
        <Link href="/dashboard/analytics" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Back to All Analytics
        </Link>
        <h1 style={{ margin: '15px 0 5px 0', color: '#1f2937' }}>
          📖 {blogData?.title || 'Blog'}
        </h1>
        {blogData?.url && (
          <p style={{ margin: '5px 0', color: '#6b7280', fontSize: '14px' }}>
            {blogData.url}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '20px', maxWidth: '200px' }}>
        <select
          value={dateRange}
          onChange={(e) => handleDateRangeChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '30px',
        gap: '30px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '15px 0',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : 'none',
              fontSize: '16px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && analyticsData && (
        <OverviewTab data={analyticsData} />
      )}

      {activeTab === 'analytics' && (
        <GoogleAnalyticsTab blogId={blogId} token={token} />
      )}

      {activeTab === 'seo' && (
        <SearchConsoleTab blogId={blogId} token={token} />
      )}
    </div>
  );
}

function OverviewTab({ data }) {
  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <MetricCard title="Total Views" value={data.totalViews} icon="👁️" color="#3b82f6" />
        <MetricCard title="Total Visitors" value={data.totalVisitors} icon="👥" color="#8b5cf6" />
        <MetricCard title="Avg Engagement" value={(data.avgEngagementScore?.toFixed(1) || 0)} icon="💬" color="#10b981" suffix="%" />
        <MetricCard title="Bounce Rate" value={(data.avgBounceRate?.toFixed(1) || 0)} icon="🚫" color="#f59e0b" suffix="%" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>📈 Views Trend</h3>
          <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
            {data.dailyTrend && data.dailyTrend.length > 0 ? (
              data.dailyTrend.map((day, idx) => {
                const maxViews = Math.max(...data.dailyTrend.map(d => d.views));
                const height = (day.views / maxViews) * 200;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: `${height}px`,
                      backgroundColor: '#3b82f6',
                      borderRadius: '3px'
                    }}
                    title={`${day.date}: ${day.views} views`}
                  />
                );
              })
            ) : (
              <p>No data</p>
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '16px' }}>🔝 Top Pages</h3>
          {data.topPages && data.topPages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.topPages.slice(0, 4).map((page, idx) => (
                <div key={idx} style={{
                  padding: '8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  fontSize: '13px',
                  borderLeft: '3px solid #3b82f6'
                }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '500', color: '#1f2937' }}>
                    {page.url?.split('/').pop() || 'Page'}
                  </p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>
                    {page.totalEvents} events
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>No data</p>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleAnalyticsTab({ blogId, token }) {
  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <GoogleAnalyticsWidget blogId={blogId} token={token} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <RealtimeVisitors blogId={blogId} token={token} />
        <TrafficSources blogId={blogId} token={token} />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <KeywordRankings blogId={blogId} token={token} />
      </div>
    </div>
  );
}

function SearchConsoleTab({ blogId, token }) {
  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <SearchConsoleWidget blogId={blogId} token={token} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <SEOMetrics blogId={blogId} token={token} />
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>📚 About Search Console</h3>
          <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '14px' }}>
            Search Console data shows your website's performance in Google Search.
          </p>
          <Link href="/dashboard/settings/integrations/search-console" style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            🔧 Manage Settings →
          </Link>
        </div>
      </div>

      <div>
        <KeywordRankings blogId={blogId} token={token} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, suffix = '' }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '20px',
      borderLeft: `4px solid ${color}`
    }}>
      <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color }}>
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      <p style={{ margin: '10px 0 0 0', fontSize: '20px' }}>{icon}</p>
    </div>
  );
}
