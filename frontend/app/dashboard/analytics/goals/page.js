'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GoalsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlogId, setSelectedBlogId] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'pageview',
    description: '',
    value: 0
  });

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs || []);
        if (data.blogs?.length > 0) {
          setSelectedBlogId(data.blogs[0]._id);
          fetchGoals(data.blogs[0]._id, authToken);
        }
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    }
  };

  const fetchGoals = async (blogId, authToken) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/goals/${blogId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
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

  const handleBlogChange = (blogId) => {
    setSelectedBlogId(blogId);
    fetchGoals(blogId, token);
  };

  const handleCreateGoal = async () => {
    if (!formData.name || !selectedBlogId) {
      alert('Goal name and blog are required');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/goals/${selectedBlogId}`,
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
        setFormData({ name: '', type: 'pageview', description: '', value: 0 });
        setShowCreateForm(false);
        fetchGoals(selectedBlogId, token);
      } else {
        alert('Error creating goal');
      }
    } catch (err) {
      alert('Error creating goal');
    }
  };

  const selectedBlog = blogs.find(b => b._id === selectedBlogId);
  const goalTypes = [
    { value: 'pageview', label: 'Page View' },
    { value: 'scroll_depth', label: 'Scroll Depth' },
    { value: 'time_on_page', label: 'Time on Page' },
    { value: 'click', label: 'Click' },
    { value: 'form_submit', label: 'Form Submit' },
    { value: 'custom_event', label: 'Custom Event' }
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <Link href="/dashboard/analytics" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '15px', display: 'block' }}>
          ← Back to Analytics
        </Link>
        <h1 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '28px' }}>
          🎯 Goals Management
        </h1>
        <p style={{ margin: '0', color: '#6b7280' }}>
          Create and manage conversion goals for your blogs
        </p>
      </div>

      {/* Blog Selector */}
      {blogs.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
            Select Blog:
          </label>
          <select
            value={selectedBlogId || ''}
            onChange={(e) => handleBlogChange(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
              minWidth: '250px'
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

      {/* Create Goal Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px' }}>Create New Goal</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Goal Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Newsletter Signup"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Goal Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                {goalTypes.map(gt => (
                  <option key={gt.value} value={gt.value}>{gt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Goal Value ($) (Optional)
              </label>
              <input
                type="number"
                placeholder="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              Description (Optional)
            </label>
            <textarea
              placeholder="Describe what this goal tracks..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '100px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateGoal}
              style={{
                padding: '10px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              ✓ Create Goal
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                padding: '10px 24px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Goal Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            marginBottom: '30px'
          }}
        >
          + Create New Goal
        </button>
      )}

      {/* Goals List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading goals...
        </div>
      ) : goals.length === 0 ? (
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p style={{ fontSize: '16px', margin: '0' }}>No goals created yet</p>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Start tracking conversions by creating your first goal</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {goals.map((goal) => (
            <div key={goal._id} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px',
              borderLeft: '4px solid #3b82f6',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Goal Header */}
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '16px' }}>
                  {goal.name}
                </h3>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '13px' }}>
                  {goalTypes.find(gt => gt.value === goal.type)?.label}
                </p>
              </div>

              {/* Description */}
              {goal.description && (
                <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
                  {goal.description}
                </p>
              )}

              {/* Metrics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: 'auto',
                paddingTop: '15px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>
                    Conversions
                  </p>
                  <p style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                    {goal.conversionData?.totalConversions || 0}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>
                    Conv. Rate
                  </p>
                  <p style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                    {(goal.conversionData?.conversionRate || 0).toFixed(1)}%
                  </p>
                </div>
                {goal.conversionData?.revenue > 0 && (
                  <div>
                    <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>
                      Revenue
                    </p>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                      ${goal.conversionData.revenue.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div style={{
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {goal.enabled ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    ✓ Active
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    ⚪ Inactive
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
