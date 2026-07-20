'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SchedulePage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      const parsed = JSON.parse(userData);
      setClientId(parsed._id);
      fetchScheduledBlogs(parsed._id);
    }
  }, [router]);

  const fetchScheduledBlogs = async (cId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs?status=scheduled`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBlogs(Array.isArray(data) ? data : data.blogs || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (blogId) => {
    router.push(`/dashboard/blogs/${blogId}`);
  };

  const handleCancel = async (blogId) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs/${blogId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            status: 'draft',
            scheduledFor: null,
            scheduledTimezone: null
          })
        }
      );

      if (response.ok) {
        alert('Schedule cancelled successfully!');
        fetchScheduledBlogs(clientId);
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      alert('Failed to cancel schedule');
    }
  };

  const getTimeRemaining = (scheduledDate) => {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const diff = scheduled - now;

    if (diff < 0) return 'Publishing now...';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const sortedBlogs = blogs
    .filter(blog => filter === 'all' || blog.status === filter)
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>
              📅 Publishing Schedule
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Manage your scheduled blog posts
            </p>
          </div>
          <Link href="/dashboard/blogs/create" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}>
              + New Blog
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <StatCard
            title="Scheduled Posts"
            value={blogs.filter(b => b.status === 'scheduled').length}
            icon="📝"
            color="#3b82f6"
          />
          <StatCard
            title="Upcoming This Week"
            value={blogs.filter(b => {
              const scheduled = new Date(b.scheduledFor);
              const week = new Date();
              week.setDate(week.getDate() + 7);
              return scheduled <= week && scheduled >= new Date();
            }).length}
            icon="⏳"
            color="#f59e0b"
          />
          <StatCard
            title="Total Blogs"
            value={blogs.length}
            icon="📊"
            color="#10b981"
          />
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          {['all', 'scheduled', 'draft', 'published'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === status ? '#3b82f6' : 'white',
                color: filter === status ? 'white' : '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: filter === status ? '600' : '500',
                textTransform: 'capitalize'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Schedule List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#6b7280' }}>Loading schedule...</p>
          </div>
        ) : sortedBlogs.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              No {filter !== 'all' ? filter : ''} blogs found
            </p>
            <Link href="/dashboard/blogs/create" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                Create Your First Blog
              </button>
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '15px'
          }}>
            {sortedBlogs.map(blog => (
              <div
                key={blog._id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${
                    blog.status === 'scheduled' ? '#f59e0b' :
                    blog.status === 'published' ? '#10b981' :
                    '#8b5cf6'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                      {blog.title}
                    </h3>
                    <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                      {blog.excerpt || 'No description'}
                    </p>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        <span style={{ fontWeight: '500' }}>Status:</span>{' '}
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor: {
                            'draft': '#8b5cf6',
                            'scheduled': '#f59e0b',
                            'published': '#10b981',
                            'in_review': '#3b82f6'
                          }[blog.status] || '#6b7280',
                          color: 'white',
                          borderRadius: '3px',
                          textTransform: 'capitalize',
                          fontSize: '12px'
                        }}>
                          {blog.status}
                        </span>
                      </div>

                      {blog.scheduledFor && (
                        <>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            <span style={{ fontWeight: '500' }}>Scheduled:</span>{' '}
                            {new Date(blog.scheduledFor).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '500' }}>
                            {getTimeRemaining(blog.scheduledFor)}
                          </div>
                        </>
                      )}

                      {blog.scheduledTimezone && (
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          <span style={{ fontWeight: '500' }}>Timezone:</span> {blog.scheduledTimezone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                    <Link href={`/dashboard/blogs/${blog._id}`} style={{ textDecoration: 'none' }}>
                      <button style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        Edit
                      </button>
                    </Link>

                    {blog.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleReschedule(blog._id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(blog._id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
            {title}
          </p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color }}>
            {value}
          </p>
        </div>
        <div style={{ fontSize: '32px' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
