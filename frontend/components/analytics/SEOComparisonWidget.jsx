'use client';

import { useEffect, useState } from 'react';

export default function SEOComparisonWidget({ blogs, token }) {
  const [seoData, setSeoData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSEOData();
  }, [blogs, token]);

  const fetchSEOData = async () => {
    try {
      setLoading(true);
      const data = {};

      for (const blog of blogs) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/analytics/seo-metrics/${blog._id}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          if (response.ok) {
            const result = await response.json();
            data[blog._id] = result;
          }
        } catch (err) {
          console.error(`Failed to fetch SEO data for blog ${blog._id}:`, err);
        }
      }

      setSeoData(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch SEO data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          Loading SEO metrics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        color: '#991b1b',
        padding: '16px',
        borderRadius: '8px'
      }}>
        {error}
      </div>
    );
  }

  const getTrendIcon = (trend) => {
    if (!trend) return '→';
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };

  const getTrendColor = (trend) => {
    if (!trend) return '#6b7280';
    if (trend > 0) return '#10b981';
    if (trend < 0) return '#ef4444';
    return '#6b7280';
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px'
    }}>
      <h3 style={{
        margin: '0 0 24px 0',
        color: '#1f2937',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        📈 SEO Metrics Comparison
      </h3>

      {/* Clicks Comparison */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{
          margin: '0 0 16px 0',
          color: '#374151',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          Search Clicks Trend
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {blogs.map((blog) => {
            const data = seoData[blog._id];
            return (
              <div
                key={blog._id}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <p style={{
                  margin: '0 0 12px 0',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {blog.title}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#3b82f6'
                  }}>
                    {data?.clickTrend || 0}%
                  </p>
                  <span style={{
                    fontSize: '16px',
                    color: getTrendColor(data?.clickTrend)
                  }}>
                    {getTrendIcon(data?.clickTrend)}
                  </span>
                </div>

                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  vs previous 30 days
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impressions Comparison */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{
          margin: '0 0 16px 0',
          color: '#374151',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          Search Impressions Trend
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {blogs.map((blog) => {
            const data = seoData[blog._id];
            return (
              <div
                key={blog._id}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <p style={{
                  margin: '0 0 12px 0',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {blog.title}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#8b5cf6'
                  }}>
                    {data?.impressionTrend || 0}%
                  </p>
                  <span style={{
                    fontSize: '16px',
                    color: getTrendColor(data?.impressionTrend)
                  }}>
                    {getTrendIcon(data?.impressionTrend)}
                  </span>
                </div>

                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  vs previous 30 days
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTR Comparison */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{
          margin: '0 0 16px 0',
          color: '#374151',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          Click-Through Rate (CTR)
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {blogs.map((blog) => {
            const data = seoData[blog._id];
            const ctr = data?.averageCTR || 0;

            return (
              <div
                key={blog._id}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <p style={{
                  margin: '0 0 12px 0',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {blog.title}
                </p>

                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#10b981'
                }}>
                  {ctr.toFixed(2)}%
                </p>

                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginTop: '8px'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(ctr * 50, 100)}%`,
                    backgroundColor: '#10b981',
                    borderRadius: '3px'
                  }}></div>
                </div>

                <p style={{
                  margin: '6px 0 0 0',
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  Industry avg: 2%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Average Position Comparison */}
      <div>
        <h4 style={{
          margin: '0 0 16px 0',
          color: '#374151',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          Average Search Position
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {blogs.map((blog) => {
            const data = seoData[blog._id];
            const position = data?.averagePosition || 0;
            const quality = position <= 10 ? 'Excellent' : position <= 30 ? 'Good' : 'Needs Improvement';
            const color = position <= 10 ? '#10b981' : position <= 30 ? '#3b82f6' : '#f59e0b';

            return (
              <div
                key={blog._id}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <p style={{
                  margin: '0 0 12px 0',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {blog.title}
                </p>

                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: color
                }}>
                  #{position.toFixed(1)}
                </p>

                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  fontWeight: '500',
                  color: color
                }}>
                  {quality}
                </p>

                <p style={{
                  margin: '6px 0 0 0',
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  Lower is better
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
