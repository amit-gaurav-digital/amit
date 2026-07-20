'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Hong_Kong', 'Asia/Singapore', 'Australia/Sydney', 'Australia/Melbourne'
];

export default function CreateBlogPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    status: 'draft',
    scheduledFor: '',
    scheduledTimezone: 'UTC'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setClientId(parsed._id);
      fetchRecentBlogs();
    }
  }, []);

  const fetchRecentBlogs = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs?limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRecentBlogs(Array.isArray(data) ? data : data.blogs || []);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!clientId) {
      setError('Client ID not found. Please refresh the page.');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        clientId
      };

      if (formData.status === 'scheduled' && formData.scheduledFor) {
        submitData.scheduledFor = new Date(formData.scheduledFor).toISOString();
        submitData.scheduledTimezone = formData.scheduledTimezone;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(submitData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Blog created successfully!');
        router.push('/dashboard/blogs');
      } else {
        setError(data.error || 'Failed to create blog');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <Link href="/dashboard/blogs" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            ← Back to Blogs
          </Link>
          <h1 style={{ margin: '15px 0 0 0', color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>Create New Blog</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Start writing your new blog post or schedule it for later</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Main Form */}
          <div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
              Blog Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter blog title"
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of your blog"
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Content */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
              Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your blog content here..."
              rows="10"
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                fontFamily: 'monospace'
              }}
            />
          </div>

          {/* Status */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="draft">📝 Draft</option>
              <option value="in_review">👁️ In Review</option>
              <option value="scheduled">📅 Scheduled</option>
              <option value="published">✅ Published</option>
            </select>
          </div>

          {/* Scheduling Section - Only show when status is "scheduled" */}
          {formData.status === 'scheduled' && (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                📅 Schedule Publication
              </h3>

              {/* Schedule Date */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Publish Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="scheduledFor"
                  value={formData.scheduledFor}
                  onChange={handleChange}
                  required={formData.status === 'scheduled'}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
                  Select when your blog should be automatically published
                </p>
              </div>

              {/* Timezone */}
              <div style={{ marginBottom: '0' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Timezone
                </label>
                <select
                  name="scheduledTimezone"
                  value={formData.scheduledTimezone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              {loading ? 'Creating...' : 'Create Blog'}
            </button>
            <Link href="/dashboard/blogs">
              <button
                type="button"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </Link>
          </div>
          </div>

          {/* Sidebar - Recent Blogs */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: 'fit-content',
            position: 'sticky',
            top: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
              📝 Recent Blogs
            </h3>

            {recentBlogs.length === 0 ? (
              <p style={{ margin: 0, color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                No blogs yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentBlogs.map(blog => (
                  <Link
                    key={blog._id}
                    href={`/dashboard/blogs/${blog._id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      borderLeft: '3px solid #3b82f6',
                      transition: 'all 0.2s',
                      ':hover': { backgroundColor: '#f0f4f8' }
                    }}>
                      <p style={{ margin: 0, color: '#1f2937', fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {blog.title}
                      </p>
                      <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          backgroundColor: {
                            'draft': '#8b5cf6',
                            'scheduled': '#f59e0b',
                            'published': '#10b981',
                            'in_review': '#3b82f6'
                          }[blog.status] || '#6b7280',
                          color: 'white',
                          borderRadius: '2px',
                          fontSize: '11px',
                          textTransform: 'capitalize'
                        }}>
                          {blog.status}
                        </span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link href="/dashboard/blogs" style={{ textDecoration: 'none', display: 'block', marginTop: '20px' }}>
              <button style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#f3f4f6',
                color: '#3b82f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                View All Blogs →
              </button>
            </Link>

            {/* Scheduling Tips */}
            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '13px', fontWeight: '600' }}>
                💡 Scheduling Tips
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '12px', lineHeight: '1.6' }}>
                <li>Set a future date/time to schedule</li>
                <li>Select your timezone for accuracy</li>
                <li>Posts auto-publish at scheduled time</li>
                <li>You can reschedule anytime</li>
              </ul>
            </div>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}
