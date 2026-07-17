'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchBlogs();
  }, [filters, page]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page,
        limit,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs?${query}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs/${blogId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        setBlogs(blogs.filter(b => b._id !== blogId));
        alert('Blog deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    }
  };

  const handlePublish = async (blogId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs/${blogId}/publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ immediate: true })
        }
      );

      if (response.ok) {
        fetchBlogs();
        alert('Blog published successfully');
      }
    } catch (error) {
      console.error('Error publishing blog:', error);
      alert('Failed to publish blog');
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>Blogs</h1>
            <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              {total} total blog{total !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/dashboard/blogs/create">
            <button style={{
              padding: '10px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              + New Blog
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <input
            type="text"
            placeholder="Search blogs..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
            style={{
              flex: 1,
              padding: '10px 15px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            style={{
              padding: '10px 15px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Blogs Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Loading blogs...
            </div>
          ) : blogs.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
              <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
                No blogs found. Create your first blog to get started!
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Title</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Views</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>SEO</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Date</th>
                  <th style={{ padding: '15px', textAlign: 'center', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog, idx) => (
                  <tr key={blog._id} style={{ borderBottom: idx === blogs.length - 1 ? 'none' : '1px solid #e5e7eb' }}>
                    <td style={{ padding: '15px', color: '#1f2937', fontWeight: '500' }}>
                      <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {blog.title}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: getStatusBg(blog.status),
                        color: getStatusText(blog.status),
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {blog.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px', color: '#6b7280' }}>{blog.views || 0}</td>
                    <td style={{ padding: '15px', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                          width: '40px',
                          height: '6px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${(blog.seoScore || 0)}%`,
                            backgroundColor: getSeoColor(blog.seoScore || 0)
                          }}></div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600' }}>{blog.seoScore || 0}</span>
                      </div>
                    </td>
                    <td style={{ padding: '15px', color: '#6b7280', fontSize: '13px' }}>
                      {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : 'Not published'}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href={`/dashboard/blogs/${blog._id}`}>
                          <button style={{
                            padding: '6px 12px',
                            backgroundColor: '#e0e7ff',
                            color: '#3b82f6',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Edit
                          </button>
                        </Link>
                        {blog.status === 'in_review' && (
                          <Link href={`/dashboard/blogs/${blog._id}/review`}>
                            <button style={{
                              padding: '6px 12px',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              Review
                            </button>
                          </Link>
                        )}
                        {blog.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(blog._id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#dcfce7',
                              color: '#16a34a',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(blog._id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '30px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 12px',
                backgroundColor: page === 1 ? '#e5e7eb' : 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: page === 1 ? '#9ca3af' : '#1f2937',
                fontWeight: '500'
              }}
            >
              Previous
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: p === page ? '#3b82f6' : 'white',
                  color: p === page ? 'white' : '#1f2937',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page === pages}
              style={{
                padding: '8px 12px',
                backgroundColor: page === pages ? '#e5e7eb' : 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: page === pages ? 'not-allowed' : 'pointer',
                color: page === pages ? '#9ca3af' : '#1f2937',
                fontWeight: '500'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusBg(status) {
  const colors = {
    draft: '#f3f4f6',
    in_review: '#fef3c7',
    scheduled: '#cffafe',
    published: '#dcfce7',
    archived: '#f3f4f6'
  };
  return colors[status] || '#f3f4f6';
}

function getStatusText(status) {
  const colors = {
    draft: '#6b7280',
    in_review: '#92400e',
    scheduled: '#0e7490',
    published: '#15803d',
    archived: '#6b7280'
  };
  return colors[status] || '#6b7280';
}

function getSeoColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}
