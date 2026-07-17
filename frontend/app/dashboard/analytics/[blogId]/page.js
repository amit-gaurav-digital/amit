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
    { id: 'engagement', label: '💬 Engagement', icon: '💬' },
    { id: 'performance', label: '⚡ Performance', icon: '⚡' },
    { id: 'segments', label: '🎯 Segments', icon: '🎯' },
    { id: 'analytics', label: '📈 Google Analytics', icon: '📈' },
    { id: 'seo', label: '🔍 Search Console', icon: '🔍' },
    { id: 'goals', label: '🎯 Goals', icon: '🎯' },
    { id: 'alerts', label: '🚨 Alerts', icon: '🚨' },
    { id: 'reports', label: '📋 Reports', icon: '📋' }
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

      {activeTab === 'engagement' && (
        <EngagementTab blogId={blogId} token={token} />
      )}

      {activeTab === 'performance' && (
        <PerformanceTab blogId={blogId} token={token} />
      )}

      {activeTab === 'segments' && (
        <SegmentsTab blogId={blogId} token={token} />
      )}

      {activeTab === 'analytics' && (
        <GoogleAnalyticsTab blogId={blogId} token={token} />
      )}

      {activeTab === 'seo' && (
        <SearchConsoleTab blogId={blogId} token={token} />
      )}

      {activeTab === 'goals' && (
        <GoalsTab blogId={blogId} token={token} />
      )}

      {activeTab === 'alerts' && (
        <AlertsTab blogId={blogId} token={token} />
      )}

      {activeTab === 'reports' && (
        <ReportsTab blogId={blogId} token={token} />
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

function EngagementTab({ blogId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEngagementData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/blog/${blogId}/engagement-detail`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (response.ok) {
          setData(await response.json());
        }
      } catch (err) {
        console.error('Error fetching engagement data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchEngagementData();
  }, [blogId, token]);

  if (loading) return <div style={{ textAlign: 'center', padding: '30px' }}>Loading...</div>;

  return (
    <div>
      {data?.metrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <MetricCard title="Engagement Score" value={(data.metrics.engagementScore?.toFixed(1) || 0)} icon="⭐" color="#f59e0b" suffix="/100" />
          <MetricCard title="Avg Session Duration" value={`${(data.metrics.avgSessionDuration / 60).toFixed(1)}m`} icon="⏱️" color="#3b82f6" />
          <MetricCard title="Bounce Rate" value={(data.metrics.bounceRate?.toFixed(1) || 0)} icon="📉" color="#ef4444" suffix="%" />
          <MetricCard title="Scroll Depth" value={(data.metrics.scrollDepth?.toFixed(1) || 0)} icon="📜" color="#8b5cf6" suffix="%" />
        </div>
      )}

      {data?.daily && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>📊 Daily Engagement Trend</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '200px' }}>
            {data.daily.map((day, idx) => (
              <div key={idx} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  height: `${(day.engagementScore / 100) * 180}px`,
                  width: '100%',
                  backgroundColor: '#8b5cf6',
                  borderRadius: '3px'
                }} title={`${day.engagementScore?.toFixed(1)}/100`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PerformanceTab({ blogId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/blog/${blogId}/performance`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (response.ok) {
          setData(await response.json());
        }
      } catch (err) {
        console.error('Error fetching performance data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchPerformanceData();
  }, [blogId, token]);

  if (loading) return <div style={{ textAlign: 'center', padding: '30px' }}>Loading...</div>;

  return (
    <div>
      {data?.averageMetrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <MetricCard title="Page Load Time" value={data.averageMetrics.pageLoadTime?.toFixed(1) || 0} icon="⚡" color="#10b981" suffix="ms" />
          <MetricCard title="FCP" value={data.averageMetrics.fcp?.toFixed(0) || 0} icon="🎯" color="#3b82f6" suffix="ms" />
          <MetricCard title="LCP" value={data.averageMetrics.lcp?.toFixed(0) || 0} icon="📏" color="#8b5cf6" suffix="ms" />
          <MetricCard title="CLS" value={data.averageMetrics.cls?.toFixed(3) || 0} icon="🔄" color="#f59e0b" />
        </div>
      )}

      {data?.webVitals && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#065f46' }}>📊 Core Web Vitals</h3>
          {Object.entries(data.webVitals).map(([key, vital]) => (
            <div key={key} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #d1fae5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#047857' }}>{vital.label}</span>
                <strong style={{ color: vital.value <= vital.target ? '#10b981' : '#ef4444' }}>
                  {vital.value.toFixed(0)} / {vital.target}ms
                </strong>
              </div>
              <div style={{
                height: '6px',
                backgroundColor: '#d1fae5',
                borderRadius: '3px',
                marginTop: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((vital.value / vital.target) * 100, 100)}%`,
                  backgroundColor: vital.value <= vital.target ? '#10b981' : '#ef4444'
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SegmentsTab({ blogId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [segmentType, setSegmentType] = useState('device');

  useEffect(() => {
    const fetchSegmentData = async () => {
      try {
        const endpoint = segmentType === 'device'
          ? 'blog'
          : segmentType === 'geography'
          ? `blog/${blogId}/geography`
          : `blog/${blogId}/referrers`;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/${endpoint}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (response.ok) {
          setData(await response.json());
        }
      } catch (err) {
        console.error('Error fetching segment data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchSegmentData();
  }, [blogId, token, segmentType]);

  if (loading) return <div style={{ textAlign: 'center', padding: '30px' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <select
          value={segmentType}
          onChange={(e) => setSegmentType(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="device">Device Type</option>
          <option value="geography">Geography</option>
          <option value="traffic">Traffic Source</option>
        </select>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>📊 Segment Analysis</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>
                  {segmentType === 'device' ? 'Device' : segmentType === 'geography' ? 'Country' : 'Source'}
                </th>
                <th style={{ textAlign: 'right', padding: '12px', color: '#374151', fontWeight: '600' }}>Views</th>
                <th style={{ textAlign: 'right', padding: '12px', color: '#374151', fontWeight: '600' }}>Visitors</th>
                <th style={{ textAlign: 'right', padding: '12px', color: '#374151', fontWeight: '600' }}>Bounce Rate</th>
              </tr>
            </thead>
            <tbody>
              {data?.deviceBreakdown && segmentType === 'device' && data.deviceBreakdown.map((device, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', color: '#1f2937' }}>{device.device}</td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#6b7280' }}>{device.views.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#6b7280' }}>{device.visitors.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#6b7280' }}>{device.bounceRate?.toFixed(1)}%</td>
                </tr>
              ))}
              {data?.countries && segmentType === 'geography' && data.countries.map((country, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', color: '#1f2937' }}>{country.country}</td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#6b7280' }}>{country.views.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#6b7280' }}>{country.visitors.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#6b7280' }}>{country.bounceRate?.toFixed(1)}%</td>
                </tr>
              ))}
              {data?.referrers && segmentType === 'traffic' && data.referrers.map((ref, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', color: '#1f2937' }}>{ref.source}</td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#6b7280' }}>{ref.views.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#6b7280' }}>{ref.visitors.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#6b7280' }}>{ref.bounceRate?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GoalsTab({ blogId, token }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'pageview', description: '' });

  useEffect(() => {
    fetchGoals();
  }, [blogId, token]);

  const fetchGoals = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/goals/${blogId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!formData.name) {
      alert('Goal name required');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/goals/${blogId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        setFormData({ name: '', type: 'pageview', description: '' });
        setShowForm(false);
        fetchGoals();
      }
    } catch (err) {
      alert('Error creating goal');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '30px' }}>Loading...</div>;

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: '500'
        }}
      >
        + Create Goal
      </button>

      {showForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>Create New Goal</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Goal Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="pageview">Page View</option>
              <option value="scroll_depth">Scroll Depth</option>
              <option value="time_on_page">Time on Page</option>
              <option value="click">Click</option>
              <option value="form_submit">Form Submit</option>
              <option value="custom_event">Custom Event</option>
            </select>
          </div>
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '15px',
              minHeight: '80px',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateGoal}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Save Goal
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {goals.length > 0 ? (
          goals.map((goal) => (
            <div key={goal._id} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>{goal.name}</h4>
              <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px' }}>
                <strong>Type:</strong> {goal.type.replace('_', ' ').toUpperCase()}
              </p>
              {goal.description && (
                <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px' }}>
                  {goal.description}
                </p>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                paddingTop: '10px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>Conversions</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                    {goal.conversionData?.totalConversions || 0}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>Rate</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                    {(goal.conversionData?.conversionRate || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#6b7280', gridColumn: '1 / -1' }}>No goals created yet. Create one to start tracking conversions!</p>
        )}
      </div>
    </div>
  );
}

function AlertsTab({ blogId, token }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    metric: 'pageViews',
    condition: 'exceeds',
    threshold: 100,
    recipients: []
  });

  useEffect(() => {
    fetchAlerts();
  }, [blogId, token]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/alerts/${blogId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!formData.name || !formData.threshold) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/alerts/${blogId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        setFormData({
          name: '',
          metric: 'pageViews',
          condition: 'exceeds',
          threshold: 100,
          recipients: []
        });
        setShowForm(false);
        fetchAlerts();
      }
    } catch (err) {
      alert('Error creating alert');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '30px' }}>Loading...</div>;

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: '500'
        }}
      >
        + Create Alert
      </button>

      {showForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>Create Alert</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Alert Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <select
              value={formData.metric}
              onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="pageViews">Page Views</option>
              <option value="visitors">Visitors</option>
              <option value="bounceRate">Bounce Rate</option>
              <option value="engagementScore">Engagement Score</option>
              <option value="conversionRate">Conversion Rate</option>
            </select>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="exceeds">Exceeds</option>
              <option value="drops_below">Drops Below</option>
              <option value="increases_by">Increases By %</option>
              <option value="decreases_by">Decreases By %</option>
            </select>
            <input
              type="number"
              placeholder="Threshold"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateAlert}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Save Alert
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert._id} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px',
              borderLeft: `4px solid ${alert.enabled ? '#ef4444' : '#d1d5db'}`
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>{alert.name}</h4>
              <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px' }}>
                <strong>{alert.metric}</strong> {alert.condition} {alert.threshold}
              </p>
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  backgroundColor: alert.enabled ? '#fecaca' : '#e5e7eb',
                  color: alert.enabled ? '#991b1b' : '#6b7280',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {alert.enabled ? '🔴 Active' : '⚪ Inactive'}
                </span>
                {alert.statistics?.totalTriggered > 0 && (
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    Triggered {alert.statistics.totalTriggered}x
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#6b7280', gridColumn: '1 / -1' }}>No alerts created yet. Create one to monitor your metrics!</p>
        )}
      </div>
    </div>
  );
}

function ReportsTab({ blogId, token }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'weekly',
    metrics: ['views', 'visitors'],
    description: ''
  });

  useEffect(() => {
    fetchReports();
  }, [blogId, token]);

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/reports/${blogId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    if (!formData.name) {
      alert('Report name required');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/reports/${blogId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        setFormData({
          name: '',
          type: 'weekly',
          metrics: ['views', 'visitors'],
          description: ''
        });
        setShowForm(false);
        fetchReports();
      }
    } catch (err) {
      alert('Error creating report');
    }
  };

  const toggleMetric = (metric) => {
    setFormData({
      ...formData,
      metrics: formData.metrics.includes(metric)
        ? formData.metrics.filter(m => m !== metric)
        : [...formData.metrics, metric]
    });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '30px' }}>Loading...</div>;

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: '500'
        }}
      >
        + Create Report
      </button>

      {showForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>Create Report</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Report Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              Metrics to Include:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {['views', 'visitors', 'engagement', 'bounceRate'].map(metric => (
                <label key={metric} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.metrics.includes(metric)}
                    onChange={() => toggleMetric(metric)}
                  />
                  <span style={{ color: '#374151' }}>
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '15px',
              minHeight: '80px',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateReport}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Save Report
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {reports.length > 0 ? (
          reports.map((report) => (
            <div key={report._id} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>{report.name}</h4>
              <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px' }}>
                <strong>Frequency:</strong> {report.type.toUpperCase()}
              </p>
              {report.description && (
                <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px' }}>
                  {report.description}
                </p>
              )}
              {report.schedule?.enabled && (
                <div style={{
                  padding: '10px',
                  backgroundColor: '#d1fae5',
                  borderRadius: '4px',
                  marginTop: '10px',
                  color: '#065f46',
                  fontSize: '12px'
                }}>
                  ✓ Auto-scheduled: {report.schedule.frequency} at {report.schedule.time}
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: '#6b7280', gridColumn: '1 / -1' }}>No reports created yet. Create one to automate your analytics reporting!</p>
        )}
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
