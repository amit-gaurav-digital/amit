'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MultiSelectBlogs from '@/components/analytics/MultiSelectBlogs';

export default function ComparisonPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlogs, setSelectedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      router.push('/login');
      return;
    }
    setToken(authToken);
    fetchBlogs(authToken);
  }, [router]);

  const fetchBlogs = async (authToken) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch blogs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlogsSelected = (selected) => {
    setSelectedBlogs(selected);
  };

  const handleCompare = () => {
    if (selectedBlogs.length < 2) {
      alert('Please select at least 2 blogs to compare');
      return;
    }

    const ids = selectedBlogs.map(b => b._id).join(',');
    router.push(`/dashboard/analytics/compare/${ids}`);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <Link href="/dashboard/analytics" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '15px', display: 'block' }}>
          ← Back to Analytics
        </Link>
        <h1 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '32px', fontWeight: 'bold' }}>
          📊 Compare Blogs
        </h1>
        <p style={{ margin: '0', color: '#6b7280' }}>
          Compare performance metrics across multiple blogs side-by-side
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#6b7280' }}>Loading blogs...</p>
        </div>
      ) : (
        <>
          {/* Main Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            marginBottom: '30px'
          }}>
            {/* Blog Selector */}
            <div>
              <MultiSelectBlogs
                blogs={blogs}
                token={token}
                onSelect={handleBlogsSelected}
              />
            </div>

            {/* Selection Summary */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '24px',
              height: 'fit-content'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: 'bold' }}>
                Selected Blogs ({selectedBlogs.length} of {blogs.length})
              </h3>

              {selectedBlogs.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '2px dashed #d1d5db'
                }}>
                  <p style={{ margin: '0', color: '#9ca3af', fontSize: '14px' }}>
                    Select 2 or more blogs to compare
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {selectedBlogs.map((blog, idx) => (
                      <div key={blog._id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div>
                          <p style={{ margin: '0 0 4px 0', color: '#1f2937', fontWeight: '500', fontSize: '14px' }}>
                            {idx + 1}. {blog.title}
                          </p>
                          <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
                            {blog.url}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedBlogs(selectedBlogs.filter(b => b._id !== blog._id))}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '4px 8px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <button
                      onClick={handleCompare}
                      disabled={selectedBlogs.length < 2}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: selectedBlogs.length < 2 ? '#9ca3af' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: selectedBlogs.length < 2 ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🔍 Compare Now
                    </button>
                    <button
                      onClick={() => setSelectedBlogs([])}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}

              {/* Info Box */}
              <div style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
                  💡 Comparison features:
                </p>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#6b7280', fontSize: '13px' }}>
                  <li style={{ marginBottom: '6px' }}>Side-by-side metrics comparison</li>
                  <li style={{ marginBottom: '6px' }}>Performance rankings</li>
                  <li style={{ marginBottom: '6px' }}>Trend analysis</li>
                  <li>SEO metrics comparison</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1e40af', fontSize: '16px', fontWeight: 'bold' }}>
              📈 Comparison Insights
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px'
            }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#1e40af', fontSize: '12px', fontWeight: '600' }}>
                  Total Blogs
                </p>
                <p style={{ margin: '0', color: '#1e40af', fontSize: '24px', fontWeight: 'bold' }}>
                  {blogs.length}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#1e40af', fontSize: '12px', fontWeight: '600' }}>
                  Selected
                </p>
                <p style={{ margin: '0', color: '#1e40af', fontSize: '24px', fontWeight: 'bold' }}>
                  {selectedBlogs.length}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#1e40af', fontSize: '12px', fontWeight: '600' }}>
                  Ready to Compare
                </p>
                <p style={{ margin: '0', color: '#1e40af', fontSize: '24px', fontWeight: 'bold' }}>
                  {selectedBlogs.length >= 2 ? '✓' : '✗'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
