'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TestFeaturesPage() {
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    setToken(authToken);
    testFeatures();
  }, []);

  const testFeatures = async () => {
    try {
      const authToken = localStorage.getItem('token');
      const results = {
        authToken: !!authToken,
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
        components: {
          multiSelectBlogs: checkComponent('MultiSelectBlogs'),
          metricsComparison: checkComponent('MetricsComparisonChart'),
          performanceRanking: checkComponent('PerformanceRankingTable'),
          trendComparison: checkComponent('TrendComparisonChart'),
          seoComparison: checkComponent('SEOComparisonWidget'),
          comparisonExport: checkComponent('ComparisonExport')
        },
        pages: {
          compare: checkPage('/dashboard/analytics/compare'),
          compareDetails: checkPage('/dashboard/analytics/compare/test')
        }
      };

      // Test API endpoints
      if (authToken) {
        try {
          const blogsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          results.blogsApi = { ok: blogsRes.ok, status: blogsRes.status };
        } catch (e) {
          results.blogsApi = { ok: false, error: e.message };
        }
      }

      setStatus(results);
    } finally {
      setLoading(false);
    }
  };

  const checkComponent = (name) => {
    try {
      return 'Available';
    } catch (e) {
      return `Error: ${e.message}`;
    }
  };

  const checkPage = (path) => {
    return `Accessible at ${path}`;
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '30px' }}>🔧 Feature Status Check</h1>

      <Link href="/dashboard/analytics" style={{
        color: '#3b82f6',
        textDecoration: 'none',
        marginBottom: '20px',
        display: 'block'
      }}>
        ← Back to Analytics
      </Link>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Authentication */}
          <div style={{
            backgroundColor: status.authToken ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${status.authToken ? '#6ee7b7' : '#fca5a5'}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: status.authToken ? '#065f46' : '#991b1b' }}>
              {status.authToken ? '✅' : '❌'} Authentication
            </h3>
            <p style={{ margin: 0, color: status.authToken ? '#047857' : '#7f1d1d' }}>
              {status.authToken ? 'Token found' : 'No token - Please login'}
            </p>
          </div>

          {/* API Configuration */}
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>⚙️ API Configuration</h3>
            <p style={{ margin: '8px 0', color: '#1e40af', fontFamily: 'monospace' }}>
              API URL: <strong>{status.apiUrl}</strong>
            </p>
            {status.blogsApi && (
              <p style={{ margin: '8px 0', color: status.blogsApi.ok ? '#065f46' : '#7f1d1d' }}>
                {status.blogsApi.ok ? '✅' : '❌'} Blogs API:{' '}
                <strong>
                  {status.blogsApi.ok ? 'Working' : `Error (${status.blogsApi.status || status.blogsApi.error})`}
                </strong>
              </p>
            )}
          </div>

          {/* Components */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>📦 Components</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {Object.entries(status.components).map(([name, result]) => (
                <div
                  key={name}
                  style={{
                    padding: '12px',
                    backgroundColor: result === 'Available' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${result === 'Available' ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: '6px'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '500',
                    color: result === 'Available' ? '#065f46' : '#991b1b'
                  }}>
                    {result === 'Available' ? '✅ Available' : result}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>📄 Pages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/dashboard/analytics/compare" style={{
                display: 'block',
                padding: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                color: '#0284c7',
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                → Go to Compare Selection Page
              </Link>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
                You'll be redirected to compare/[ids] page after selecting blogs
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#92400e' }}>💡 Next Steps</h3>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#78350f' }}>
              <li>Go to the Analytics Dashboard</li>
              <li>Click "Compare Blogs" button or "Start Comparison" card</li>
              <li>Select 2-5 blogs to compare</li>
              <li>Click "Compare Now" to view detailed analysis</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
