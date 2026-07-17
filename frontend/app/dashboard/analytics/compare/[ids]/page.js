'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MetricsComparisonChart from '@/components/analytics/MetricsComparisonChart';
import PerformanceRankingTable from '@/components/analytics/PerformanceRankingTable';
import TrendComparisonChart from '@/components/analytics/TrendComparisonChart';
import SEOComparisonWidget from '@/components/analytics/SEOComparisonWidget';

export default function ComparisonDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      router.push('/login');
      return;
    }
    setToken(authToken);

    const blogIds = params.ids.split(',');
    fetchBlogsAndAnalytics(blogIds, authToken);
  }, [params, router]);

  const fetchBlogsAndAnalytics = async (blogIds, authToken) => {
    try {
      setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) throw new Error('Failed to fetch blogs');

      const blogsResult = await response.json();
      const selectedBlogs = blogsResult.blogs.filter(b =>
        blogIds.includes(b._id)
      );

      if (selectedBlogs.length === 0) {
        setError('No valid blogs found');
        setLoading(false);
        return;
      }

      setBlogs(selectedBlogs);

      const analyticsPromises = selectedBlogs.map(blog =>
        fetchAnalyticsForBlog(blog._id, dateRange, authToken)
      );

      const results = await Promise.all(analyticsPromises);
      setAnalyticsData(results);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsForBlog = async (blogId, days, authToken) => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/dashboard/${blogId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      if (response.ok) {
        return await response.json();
      }
      return {};
    } catch (err) {
      console.error(`Failed to fetch analytics for blog ${blogId}:`, err);
      return {};
    }
  };

  const handleDateRangeChange = async (days) => {
    setDateRange(days);
    if (blogs.length > 0 && token) {
      const results = await Promise.all(
        blogs.map(blog => fetchAnalyticsForBlog(blog._id, days, token))
      );
      setAnalyticsData(results);
    }
  };

  const handleExport = () => {
    const csv = generateCSVReport();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'blog-comparison.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateCSVReport = () => {
    let csv = 'Blog Comparison Report\n\n';
    csv += 'Blog Name,URL,Total Views,Total Visitors,Avg Engagement,Bounce Rate\n';

    blogs.forEach((blog, idx) => {
      const data = analyticsData[idx];
      csv += `"${blog.title}","${blog.url}",${data.totalViews || 0},${data.totalVisitors || 0},"${(data.avgEngagementScore || 0).toFixed(1)}%","${(data.avgBounceRate || 0).toFixed(1)}%"\n`;
    });

    return csv;
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '15px' }}>📊</div>
        <p>Loading comparison data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '30px' }}>
        <Link href="/dashboard/analytics" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '15px', display: 'block' }}>
          ← Back to Analytics
        </Link>
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '16px',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div style={{ padding: '30px' }}>
        <Link href="/dashboard/analytics/compare" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '15px', display: 'block' }}>
          ← Back to Comparison
        </Link>
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '24px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          No blogs available for comparison
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <Link href="/dashboard/analytics/compare" style={{
          color: '#3b82f6',
          textDecoration: 'none',
          marginBottom: '15px',
          display: 'block'
        }}>
          ← Back to Compare Selection
        </Link>
        <h1 style={{
          margin: '0 0 10px 0',
          color: '#1f2937',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          📊 Blog Comparison Analysis
        </h1>
        <p style={{ margin: '0', color: '#6b7280' }}>
          Comparing {blogs.length} blogs side-by-side
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <label style={{
            color: '#374151',
            fontWeight: '500',
            fontSize: '14px'
          }}>
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Blogs Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {blogs.map((blog, idx) => (
          <div
            key={blog._id}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px',
              borderTop: `4px solid ${'#3b82f6 #8b5cf6 #10b981 #f59e0b #ec4899'.split(' ')[idx % 5]}`
            }}
          >
            <h4 style={{
              margin: '0 0 10px 0',
              color: '#1f2937',
              fontSize: '16px',
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {blog.title}
            </h4>
            <p style={{
              margin: '0 0 12px 0',
              color: '#6b7280',
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {blog.url}
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '11px' }}>
                  Views
                </p>
                <p style={{ margin: 0, color: '#1f2937', fontSize: '20px', fontWeight: 'bold' }}>
                  {analyticsData[idx]?.totalViews?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '11px' }}>
                  Visitors
                </p>
                <p style={{ margin: 0, color: '#1f2937', fontSize: '20px', fontWeight: 'bold' }}>
                  {analyticsData[idx]?.totalVisitors?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'metrics', label: '📈 Metrics' },
          { key: 'rankings', label: '🏆 Rankings' },
          { key: 'trends', label: '📉 Trends' },
          { key: 'seo', label: '🔍 SEO' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === tab.key ? '#3b82f6' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <MetricsComparisonChart blogs={blogs} analyticsData={analyticsData} />
          </div>
        )}

        {activeTab === 'metrics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <MetricsComparisonChart blogs={blogs} analyticsData={analyticsData} />
          </div>
        )}

        {activeTab === 'rankings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <PerformanceRankingTable blogs={blogs} analyticsData={analyticsData} />
          </div>
        )}

        {activeTab === 'trends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <TrendComparisonChart blogs={blogs} analyticsData={analyticsData} />
          </div>
        )}

        {activeTab === 'seo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {token && <SEOComparisonWidget blogs={blogs} token={token} />}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '13px'
      }}>
        <p style={{ margin: 0 }}>
          💡 This comparison includes data from the last {dateRange} days for all selected blogs
        </p>
      </div>
    </div>
  );
}
