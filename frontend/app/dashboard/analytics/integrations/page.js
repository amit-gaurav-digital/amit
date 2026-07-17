'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleAnalyticsConnect from '@/components/analytics/GoogleAnalyticsConnect';
import SearchConsoleConnect from '@/components/analytics/SearchConsoleConnect';

export default function AnalyticsIntegrations() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchBlogs();
  }, [router]);

  const fetchBlogs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const result = await response.json();
        setBlogs(result.blogs || []);
        if (result.blogs && result.blogs.length > 0) {
          setSelectedBlog(result.blogs[0]._id);
          fetchConnections(result.blogs[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async (blogId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/google/data/${blogId}?days=1`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.ok) {
        const result = await response.json();
        setConnections(prev => ({
          ...prev,
          [blogId]: { googleAnalytics: result.data?.length > 0 }
        }));
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    }
  };

  const handleBlogChange = (blogId) => {
    setSelectedBlog(blogId);
    fetchConnections(blogId);
  };

  const handleConnect = () => {
    if (selectedBlog) {
      fetchConnections(selectedBlog);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <p>Loading integrations...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>🔗 Analytics Integrations</h1>
      <p style={{ margin: '0 0 30px 0', color: '#6b7280', fontSize: '14px' }}>
        Connect external data sources to enhance your analytics dashboard
      </p>

      {/* Blog Selector */}
      {blogs.length > 1 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <label style={{ display: 'block', marginBottom: '10px', color: '#374151', fontWeight: '500' }}>
            Select Blog
          </label>
          <select
            value={selectedBlog || ''}
            onChange={(e) => handleBlogChange(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
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
      )}

      {selectedBlog && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          <GoogleAnalyticsConnect
            blogId={selectedBlog}
            onConnect={handleConnect}
            connected={connections[selectedBlog]?.googleAnalytics || false}
          />

          <SearchConsoleConnect
            blogId={selectedBlog}
            onConnect={handleConnect}
            connected={connections[selectedBlog]?.searchConsole || false}
          />
        </div>
      )}

      {/* Integration Guide */}
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '30px',
        borderLeft: '4px solid #3b82f6'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1e40af' }}>📖 Integration Guide</h3>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '14px' }}>Google Analytics</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
              <li>Click "Connect Google Analytics" button</li>
              <li>Sign in with your Google account</li>
              <li>Select your Analytics property</li>
              <li>Authorize the connection</li>
              <li>Data will sync automatically every 24 hours</li>
            </ul>
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '14px' }}>Google Search Console</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
              <li>Enter your website URL (must match Search Console property)</li>
              <li>Click "Connect Search Console"</li>
              <li>We'll use existing Google Analytics credentials</li>
              <li>SEO metrics will appear in your analytics dashboard</li>
              <li>Data updates daily with search performance data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div style={{
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px',
        borderLeft: '4px solid #10b981'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#166534' }}>✨ Benefits</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div>
            <p style={{ margin: '0 0 5px 0', fontWeight: '600', color: '#1f2937' }}>Real-time Metrics</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Get live visitor data and active user counts
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', fontWeight: '600', color: '#1f2937' }}>SEO Insights</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Monitor search rankings and keyword performance
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', fontWeight: '600', color: '#1f2937' }}>Traffic Sources</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              See detailed breakdown of where your traffic comes from
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', fontWeight: '600', color: '#1f2937' }}>Unified Dashboard</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              All metrics in one place for easy comparison
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
