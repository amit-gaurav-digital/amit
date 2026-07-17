'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReportsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlogId, setSelectedBlogId] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'weekly',
    description: '',
    metrics: ['views', 'visitors', 'engagement'],
    schedule: {
      enabled: false,
      frequency: 'weekly',
      time: '09:00',
      timezone: 'UTC'
    },
    emailRecipients: ''
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
          fetchReports(data.blogs[0]._id, authToken);
        }
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    }
  };

  const fetchReports = async (blogId, authToken) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/reports/${blogId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlogChange = (blogId) => {
    setSelectedBlogId(blogId);
    fetchReports(blogId, token);
  };

  const handleCreateReport = async () => {
    if (!formData.name || !selectedBlogId) {
      alert('Report name and blog are required');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/reports/${selectedBlogId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            emailRecipients: formData.emailRecipients.split(',').map(r => r.trim()).filter(r => r)
          })
        }
      );

      if (response.ok) {
        setFormData({
          name: '',
          type: 'weekly',
          description: '',
          metrics: ['views', 'visitors', 'engagement'],
          schedule: {
            enabled: false,
            frequency: 'weekly',
            time: '09:00',
            timezone: 'UTC'
          },
          emailRecipients: ''
        });
        setShowCreateForm(false);
        fetchReports(selectedBlogId, token);
      } else {
        alert('Error creating report');
      }
    } catch (err) {
      alert('Error creating report');
    }
  };

  const toggleMetric = (metric) => {
    setFormData({
      ...formData,
      metrics: formData.metrics.includes(metric)
        ? formData.metrics.filter(m => m !== metric)
        : [...formData.metrics, metric]
    });
  };

  const reportTypes = [
    { value: 'daily', label: 'Daily Report' },
    { value: 'weekly', label: 'Weekly Report' },
    { value: 'monthly', label: 'Monthly Report' },
    { value: 'quarterly', label: 'Quarterly Report' },
    { value: 'annual', label: 'Annual Report' }
  ];

  const availableMetrics = [
    { value: 'views', label: 'Page Views' },
    { value: 'visitors', label: 'Unique Visitors' },
    { value: 'engagement', label: 'Engagement Score' },
    { value: 'bounceRate', label: 'Bounce Rate' },
    { value: 'performance', label: 'Performance' },
    { value: 'traffic', label: 'Traffic Sources' }
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <Link href="/dashboard/analytics" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '15px', display: 'block' }}>
          ← Back to Analytics
        </Link>
        <h1 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '28px' }}>
          📋 Reports Configuration
        </h1>
        <p style={{ margin: '0', color: '#6b7280' }}>
          Generate and schedule automated analytics reports for your blogs
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

      {/* Create Report Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px' }}>Create New Report</h2>

          {/* Basic Info */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '15px', fontWeight: '600' }}>
              Basic Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                  Report Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Weekly Blog Performance"
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
                  Report Type *
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
                  {reportTypes.map(rt => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Description (Optional)
              </label>
              <textarea
                placeholder="Describe what this report includes..."
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
          </div>

          {/* Metrics Selection */}
          <div style={{
            marginBottom: '25px',
            paddingBottom: '25px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '15px', fontWeight: '600' }}>
              Select Metrics to Include
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {availableMetrics.map(metric => (
                <label key={metric.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: formData.metrics.includes(metric.value) ? '2px solid #3b82f6' : '1px solid #e5e7eb'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.metrics.includes(metric.value)}
                    onChange={() => toggleMetric(metric.value)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ color: '#374151', fontWeight: '500' }}>
                    {metric.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div style={{ marginBottom: '25px', paddingBottom: '25px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '15px', fontWeight: '600' }}>
              Scheduling
            </h3>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              marginBottom: '15px'
            }}>
              <input
                type="checkbox"
                checked={formData.schedule.enabled}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: { ...formData.schedule, enabled: e.target.checked }
                })}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: '500', color: '#374151' }}>
                Enable Automatic Scheduling
              </span>
            </label>

            {formData.schedule.enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                    Frequency
                  </label>
                  <select
                    value={formData.schedule.frequency}
                    onChange={(e) => setFormData({
                      ...formData,
                      schedule: { ...formData.schedule, frequency: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.schedule.time}
                    onChange={(e) => setFormData({
                      ...formData,
                      schedule: { ...formData.schedule, time: e.target.value }
                    })}
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
                    Timezone
                  </label>
                  <select
                    value={formData.schedule.timezone}
                    onChange={(e) => setFormData({
                      ...formData,
                      schedule: { ...formData.schedule, timezone: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST</option>
                    <option value="CST">CST</option>
                    <option value="MST">MST</option>
                    <option value="PST">PST</option>
                    <option value="IST">IST</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Email Recipients */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '15px', fontWeight: '600' }}>
              Email Recipients
            </h3>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              Recipients (comma-separated)
            </label>
            <input
              type="text"
              placeholder="user@example.com, admin@example.com"
              value={formData.emailRecipients}
              onChange={(e) => setFormData({ ...formData, emailRecipients: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
              Leave empty to save report manually
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateReport}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              ✓ Create Report
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

      {/* Create Report Button */}
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
          + Create New Report
        </button>
      )}

      {/* Reports List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p style={{ fontSize: '16px', margin: '0' }}>No reports configured</p>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Create your first report to automate your analytics</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: '20px'
        }}>
          {reports.map((report) => (
            <div key={report._id} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px',
              borderLeft: '4px solid #3b82f6',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Report Header */}
              <h3 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '16px' }}>
                {report.name}
              </h3>
              <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '13px' }}>
                {reportTypes.find(rt => rt.value === report.type)?.label || report.type}
              </p>

              {/* Description */}
              {report.description && (
                <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
                  {report.description}
                </p>
              )}

              {/* Metrics */}
              {report.metrics?.length > 0 && (
                <div style={{
                  marginBottom: '15px',
                  paddingBottom: '15px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <p style={{ margin: '0 0 8px 0', color: '#374151', fontWeight: '500', fontSize: '13px' }}>
                    Metrics Included:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {report.metrics.map((metric, idx) => (
                      <span key={idx} style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scheduling Status */}
              {report.schedule?.enabled ? (
                <div style={{
                  backgroundColor: '#d1fae5',
                  border: '1px solid #6ee7b7',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '15px',
                  fontSize: '13px',
                  color: '#065f46'
                }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: '500' }}>
                    ✓ Auto-Scheduled
                  </p>
                  <p style={{ margin: '0' }}>
                    {report.schedule.frequency} at {report.schedule.time} {report.schedule.timezone}
                  </p>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '15px',
                  fontSize: '13px',
                  color: '#92400e'
                }}>
                  <p style={{ margin: '0' }}>
                    ⚠️ Manual Report
                  </p>
                </div>
              )}

              {/* Recipients */}
              {report.emailRecipients?.length > 0 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: '500', color: '#374151' }}>
                    Recipients:
                  </p>
                  <p style={{ margin: '0' }}>
                    {report.emailRecipients.join(', ')}
                  </p>
                </div>
              )}

              {/* Last Generated */}
              {report.lastGeneratedAt && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e5e7eb',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  Last generated: {new Date(report.lastGeneratedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
