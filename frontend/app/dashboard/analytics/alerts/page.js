'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AlertsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlogId, setSelectedBlogId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    metric: 'pageViews',
    condition: 'exceeds',
    threshold: 100,
    description: '',
    recipients: '',
    checkFrequency: 'daily'
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
          fetchAlerts(data.blogs[0]._id, authToken);
        }
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    }
  };

  const fetchAlerts = async (blogId, authToken) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/alerts/${blogId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlogChange = (blogId) => {
    setSelectedBlogId(blogId);
    fetchAlerts(blogId, token);
  };

  const handleCreateAlert = async () => {
    if (!formData.name || !selectedBlogId) {
      alert('Alert name and blog are required');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/alerts/${selectedBlogId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            recipients: formData.recipients.split(',').map(r => r.trim()).filter(r => r)
          })
        }
      );

      if (response.ok) {
        setFormData({
          name: '',
          metric: 'pageViews',
          condition: 'exceeds',
          threshold: 100,
          description: '',
          recipients: '',
          checkFrequency: 'daily'
        });
        setShowCreateForm(false);
        fetchAlerts(selectedBlogId, token);
      } else {
        alert('Error creating alert');
      }
    } catch (err) {
      alert('Error creating alert');
    }
  };

  const metrics = [
    { value: 'pageViews', label: 'Page Views' },
    { value: 'visitors', label: 'Visitors' },
    { value: 'bounceRate', label: 'Bounce Rate' },
    { value: 'engagementScore', label: 'Engagement Score' },
    { value: 'conversionRate', label: 'Conversion Rate' },
    { value: 'pageLoadTime', label: 'Page Load Time' }
  ];

  const conditions = [
    { value: 'exceeds', label: 'Exceeds' },
    { value: 'drops_below', label: 'Drops Below' },
    { value: 'increases_by', label: 'Increases By %' },
    { value: 'decreases_by', label: 'Decreases By %' }
  ];

  const getMetricLabel = (metricValue) => metrics.find(m => m.value === metricValue)?.label || metricValue;
  const getConditionLabel = (conditionValue) => conditions.find(c => c.value === conditionValue)?.label || conditionValue;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <Link href="/dashboard/analytics" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '15px', display: 'block' }}>
          ← Back to Analytics
        </Link>
        <h1 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '28px' }}>
          🚨 Alerts & Anomalies
        </h1>
        <p style={{ margin: '0', color: '#6b7280' }}>
          Monitor your metrics and get notified when anomalies occur
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

      {/* Create Alert Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px' }}>Create New Alert</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Alert Name *
              </label>
              <input
                type="text"
                placeholder="e.g., High Bounce Rate"
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
                Metric *
              </label>
              <select
                value={formData.metric}
                onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                {metrics.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Condition *
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                {conditions.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Threshold *
              </label>
              <input
                type="number"
                placeholder="100"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) || 0 })}
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
                Check Frequency *
              </label>
              <select
                value={formData.checkFrequency}
                onChange={(e) => setFormData({ ...formData, checkFrequency: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              Email Recipients (comma-separated)
            </label>
            <input
              type="text"
              placeholder="user@example.com, admin@example.com"
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              Description (Optional)
            </label>
            <textarea
              placeholder="What does this alert monitor?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '80px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateAlert}
              style={{
                padding: '10px 24px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              ✓ Create Alert
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

      {/* Create Alert Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            marginBottom: '30px'
          }}
        >
          + Create New Alert
        </button>
      )}

      {/* Alerts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p style={{ fontSize: '16px', margin: '0' }}>No alerts configured</p>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Create your first alert to monitor anomalies</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {alerts.map((alert) => (
            <div key={alert._id} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px',
              borderLeft: `4px solid ${alert.enabled ? '#ef4444' : '#d1d5db'}`,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Alert Header */}
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '16px' }}>
                  {alert.name}
                </h3>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '13px', lineHeight: '1.6' }}>
                  <strong>{getMetricLabel(alert.metric)}</strong>{' '}
                  <span style={{ color: '#9ca3af' }}>
                    {getConditionLabel(alert.condition)} {alert.threshold}
                  </span>
                </p>
              </div>

              {/* Description */}
              {alert.description && (
                <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
                  {alert.description}
                </p>
              )}

              {/* Alert Details */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '15px',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                <p style={{ margin: '0 0 6px 0' }}>
                  <strong>Check Frequency:</strong> {alert.checkFrequency || 'Daily'}
                </p>
                {alert.recipients?.length > 0 && (
                  <p style={{ margin: '0' }}>
                    <strong>Recipients:</strong> {alert.recipients.join(', ')}
                  </p>
                )}
              </div>

              {/* Trigger Statistics */}
              {alert.statistics?.totalTriggered > 0 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  borderLeft: '3px solid #f59e0b'
                }}>
                  <p style={{ margin: '0 0 6px 0', color: '#92400e', fontSize: '12px', fontWeight: '500' }}>
                    Trigger History
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: '#92400e', fontSize: '13px' }}>
                        Total Triggered: <strong>{alert.statistics.totalTriggered}</strong>
                      </span>
                    </div>
                    {alert.statistics.lastTriggered && (
                      <div>
                        <span style={{ color: '#92400e', fontSize: '13px' }}>
                          Last: <strong>{new Date(alert.statistics.lastTriggered).toLocaleDateString()}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div style={{
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '8px'
              }}>
                {alert.enabled ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    🔴 Active
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
