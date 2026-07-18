'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleAnalyticsWidget from '@/components/analytics/GoogleAnalyticsWidget';
import SearchConsoleWidget from '@/components/analytics/SearchConsoleWidget';
import RealtimeVisitors from '@/components/analytics/RealtimeVisitors';
import SEOMetrics from '@/components/analytics/SEOMetrics';
import KeywordRankings from '@/components/analytics/KeywordRankings';
import TrafficSources from '@/components/analytics/TrafficSources';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [dateRange, setDateRange] = useState('30');
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      router.push('/login');
      return;
    }
    setToken(authToken);

    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      fetchBlogs(user._id, authToken);
    }
  }, [router]);

  const fetchBlogs = async (userId, authToken) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const result = await response.json();
        setBlogs(result.blogs || []);
        if (result.blogs && result.blogs.length > 0) {
          setSelectedBlog(result.blogs[0]._id);
          fetchAnalytics(result.blogs[0]._id, dateRange, authToken);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchAnalytics = async (blogId, days, authToken) => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/dashboard/${blogId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlogChange = (blogId) => {
    setSelectedBlog(blogId);
    if (token) {
      fetchAnalytics(blogId, dateRange, token);
    }
  };

  const handleDateRangeChange = (days) => {
    setDateRange(days);
    if (selectedBlog && token) {
      fetchAnalytics(selectedBlog, days, token);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '15px' }}>📊</div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '30px', color: '#dc3545' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>📊 Analytics Dashboard</h1>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
              Select Blog
            </label>
            <select
              value={selectedBlog || ''}
              onChange={(e) => handleBlogChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              {blogs.map(blog => (
                <option key={blog._id} value={blog._id}>
                  {blog.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
              Date Range
            </label>
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

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <Link href={`/dashboard/analytics/${selectedBlog}`}>
              <button style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                View Detailed →
              </button>
            </Link>
            <Link href="/dashboard/analytics/compare">
              <button style={{
                padding: '10px 20px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                📊 Compare Blogs
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Comparison Card - Always visible */}
      <div style={{
        backgroundColor: blogs.length >= 2 ? '#f0f9ff' : '#fef3c7',
        border: `2px solid ${blogs.length >= 2 ? '#bfdbfe' : '#fcd34d'}`,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: blogs.length >= 2 ? '#1e40af' : '#92400e', fontSize: '16px', fontWeight: 'bold' }}>
            🔄 Compare Multiple Blogs
          </h3>
          <p style={{ margin: 0, color: blogs.length >= 2 ? '#0c4a6e' : '#b45309', fontSize: '14px' }}>
            {blogs.length >= 2
              ? 'Analyze performance metrics side-by-side across up to 5 blogs'
              : `Create at least 2 blogs to start comparing. You currently have ${blogs.length} blog${blogs.length === 1 ? '' : 's'}.`}
          </p>
        </div>
        <Link href="/dashboard/analytics/compare">
          <button style={{
            padding: '10px 24px',
            backgroundColor: blogs.length >= 2 ? '#0ea5e9' : '#d97706',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            opacity: blogs.length >= 2 ? 1 : 0.7
          }}>
            {blogs.length >= 2 ? 'Start Comparison →' : 'View Comparison Tool →'}
          </button>
        </Link>
      </div>

      {/* Phase 2 Features Showcase - Always visible */}
      {!data && (
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px', fontWeight: 'bold' }}>
            📊 Phase 2: Google Analytics & Comparison Features
          </h2>
          <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
            Unlock advanced analytics and blog comparison capabilities with Google integration
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {/* Feature 1 */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '24px' }}>📈</div>
              <h4 style={{ margin: 0, color: '#1f2937', fontWeight: '600' }}>Google Analytics</h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
                Real-time metrics from Google Analytics 4
              </p>
              <Link href="/dashboard/settings/integrations/google-analytics" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '8px'
                }}>
                  Configure
                </button>
              </Link>
            </div>

            {/* Feature 2 */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '24px' }}>🔍</div>
              <h4 style={{ margin: 0, color: '#1f2937', fontWeight: '600' }}>Search Console</h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
                SEO metrics and keyword performance
              </p>
              <Link href="/dashboard/settings/integrations/search-console" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '8px'
                }}>
                  Configure
                </button>
              </Link>
            </div>

            {/* Feature 3 */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '24px' }}>📊</div>
              <h4 style={{ margin: 0, color: '#1f2937', fontWeight: '600' }}>Blog Comparison</h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
                Compare metrics across multiple blogs
              </p>
              <Link href="/dashboard/analytics/compare" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '8px'
                }}>
                  Explore
                </button>
              </Link>
            </div>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#dbeafe',
            borderRadius: '6px',
            border: '1px solid #93c5fd',
            color: '#1e40af'
          }}>
            <strong>👉 Getting Started:</strong> Create a blog first, then configure Google Analytics in Settings to start seeing real-time analytics data.
          </div>
        </div>
      )}

      {/* Integrations Setup Section */}
      <div style={{
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        padding: '25px',
        marginBottom: '30px',
        border: '1px solid #fcd34d'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#92400e', fontSize: '20px', fontWeight: 'bold' }}>
          🔗 Connect Your Analytics Services
        </h2>
        <p style={{ margin: '0 0 20px 0', color: '#78350f', fontSize: '14px' }}>
          Sync data from Google Analytics and Search Console to unlock advanced insights
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '15px'
        }}>
          {/* Google Analytics Card */}
          <Link href="/dashboard/settings/integrations/google-analytics" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              height: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ fontSize: '28px' }}>📊</div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1f2937', fontWeight: '600', fontSize: '15px' }}>
                Google Analytics
              </h4>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '13px', lineHeight: '1.4' }}>
                Connect GA4 to track real-time traffic and user behavior
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                <button style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#ea4335',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Connect →
                </button>
              </div>
            </div>
          </Link>

          {/* Search Console Card */}
          <Link href="/dashboard/settings/integrations/search-console" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              height: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ fontSize: '28px' }}>🔍</div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1f2937', fontWeight: '600', fontSize: '15px' }}>
                Search Console
              </h4>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '13px', lineHeight: '1.4' }}>
                Link GSC to monitor search performance and indexing
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                <button style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Connect →
                </button>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Advanced Features Section */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        padding: '25px',
        marginBottom: '30px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px', fontWeight: 'bold' }}>
          🚀 Advanced Analytics Tools
        </h2>
        <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
          Manage goals, alerts, and automated reporting
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '15px'
        }}>
          {/* Goals Card */}
          <Link href="/dashboard/analytics/goals" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              height: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ fontSize: '28px' }}>🎯</div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1f2937', fontWeight: '600', fontSize: '15px' }}>
                Goals & Conversions
              </h4>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '13px', lineHeight: '1.4' }}>
                Track conversion goals and measure success metrics
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                <button style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Manage Goals →
                </button>
              </div>
            </div>
          </Link>

          {/* Alerts Card */}
          <Link href="/dashboard/analytics/alerts" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              height: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ fontSize: '28px' }}>🚨</div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1f2937', fontWeight: '600', fontSize: '15px' }}>
                Alerts & Anomalies
              </h4>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '13px', lineHeight: '1.4' }}>
                Monitor metrics and get notified of anomalies
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                <button style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Setup Alerts →
                </button>
              </div>
            </div>
          </Link>

          {/* Reports Card */}
          <Link href="/dashboard/analytics/reports" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              height: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ fontSize: '28px' }}>📋</div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1f2937', fontWeight: '600', fontSize: '15px' }}>
                Reports & Scheduling
              </h4>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '13px', lineHeight: '1.4' }}>
                Generate and automate analytics reports
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                <button style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Create Reports →
                </button>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {data && selectedBlog && token ? (
        <>
          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <MetricCard
              title="Total Views"
              value={data.totalViews}
              icon="👁️"
              color="#3b82f6"
            />
            <MetricCard
              title="Total Visitors"
              value={data.totalVisitors}
              icon="👥"
              color="#8b5cf6"
            />
            <MetricCard
              title="Avg Engagement"
              value={data.avgEngagementScore?.toFixed(1) || 0}
              icon="💬"
              color="#10b981"
              suffix="%"
            />
            <MetricCard
              title="Bounce Rate"
              value={data.avgBounceRate?.toFixed(1) || 0}
              icon="🚫"
              color="#f59e0b"
              suffix="%"
            />
          </div>

          {/* Google Integrations Section */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#1f2937', marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>
              📊 Google Integrations
            </h2>

            {/* GA & SC Widgets */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <GoogleAnalyticsWidget blogId={selectedBlog} token={token} />
              <SearchConsoleWidget blogId={selectedBlog} token={token} />
            </div>

            {/* Realtime & SEO */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <RealtimeVisitors blogId={selectedBlog} token={token} />
              <SEOMetrics blogId={selectedBlog} token={token} />
            </div>

            {/* Traffic Sources */}
            <div style={{ marginBottom: '30px' }}>
              <TrafficSources blogId={selectedBlog} token={token} />
            </div>

            {/* Keywords */}
            <div>
              <KeywordRankings blogId={selectedBlog} token={token} />
            </div>
          </div>

          {/* Charts Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Trend Chart */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>📈 Views Trend</h3>
              <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '20px' }}>
                {data.dailyTrend && data.dailyTrend.length > 0 ? (
                  data.dailyTrend.map((day, idx) => {
                    const maxViews = Math.max(...data.dailyTrend.map(d => d.views));
                    const height = (day.views / maxViews) * 250;
                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          height: `${height}px`,
                          backgroundColor: '#3b82f6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          opacity: 0.8,
                          transition: 'opacity 0.2s'
                        }}
                        title={`${day.date}: ${day.views} views`}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                      />
                    );
                  })
                ) : (
                  <p style={{ color: '#6b7280' }}>No data available</p>
                )}
              </div>
            </div>

            {/* Top Pages */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>🔝 Top Pages</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.topPages && data.topPages.length > 0 ? (
                  data.topPages.slice(0, 5).map((page, idx) => (
                    <div key={idx} style={{
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px',
                      borderLeft: '3px solid #3b82f6'
                    }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>
                        {page.url?.split('/').pop() || 'Page'}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                        {page.totalEvents} events
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>No page data</p>
                )}
              </div>
            </div>
          </div>

          {/* Sessions & Conversions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>📊 Session Analysis</h3>
              {data.sessionsAnalysis && Object.keys(data.sessionsAnalysis).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px' }}>Total Sessions</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                      {data.sessionsAnalysis.totalSessions || 0}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px' }}>Avg Duration</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                      {Math.floor(data.sessionsAnalysis.avgDuration || 0)}s
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px' }}>Bounce Rate</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                      {(data.sessionsAnalysis.bounceRate || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#6b7280' }}>No session data</p>
              )}
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>🎯 Performance</h3>
              {data.performanceMetrics && Object.keys(data.performanceMetrics).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px' }}>Avg Load Time</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                      {(data.performanceMetrics.avgPageLoadTime || 0).toFixed(0)}ms
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px' }}>FCP</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0ea5e9' }}>
                      {(data.performanceMetrics.avgFCP || 0).toFixed(0)}ms
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px' }}>LCP</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#ec4899' }}>
                      {(data.performanceMetrics.avgLCP || 0).toFixed(0)}ms
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#6b7280' }}>No performance data</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
          <p>No analytics data available. Create and view your first blog!</p>
        </div>
      )}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
            {title}
          </p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color }}>
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
        <div style={{ fontSize: '24px' }}>{icon}</div>
      </div>
    </div>
  );
}
