'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WorkflowAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflow/analytics?timeRange=${timeRange}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>
              Workflow Analytics
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Track your blog publishing workflow metrics
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: 'white'
            }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <StatCard
            title="Total Workflows"
            value={analytics?.totalWorkflows || 0}
            icon="📊"
            color="#3b82f6"
          />
          <StatCard
            title="In Review"
            value={analytics?.byStage?.in_review || 0}
            icon="👁️"
            color="#f59e0b"
          />
          <StatCard
            title="Pending Reviews"
            value={analytics?.pendingReviews || 0}
            icon="⏳"
            color="#ef4444"
          />
          <StatCard
            title="Avg Review Time"
            value={`${analytics?.averageReviewTime || 0} days`}
            icon="📅"
            color="#10b981"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Workflow Status Distribution */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
              Workflow Status Distribution
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                { label: 'Draft', value: analytics?.byStage?.draft || 0, color: '#f3f4f6', textColor: '#6b7280' },
                { label: 'In Review', value: analytics?.byStage?.in_review || 0, color: '#fef3c7', textColor: '#92400e' },
                { label: 'Approved', value: analytics?.byStage?.approved || 0, color: '#dcfce7', textColor: '#15803d' },
                { label: 'Published', value: analytics?.byStage?.published || 0, color: '#dcfce7', textColor: '#15803d' },
                { label: 'Rejected', value: analytics?.byStage?.rejected || 0, color: '#fee2e2', textColor: '#991b1b' }
              ].map((stage, idx) => {
                const total = analytics?.totalWorkflows || 1;
                const percentage = Math.round((stage.value / total) * 100);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#1f2937', fontWeight: '500' }}>{stage.label}</span>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>
                        {stage.value} ({percentage}%)
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: stage.textColor,
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Metrics */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
              Performance
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
                <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                  Avg Review Time
                </p>
                <p style={{ margin: 0, color: '#3b82f6', fontSize: '20px', fontWeight: '700' }}>
                  {analytics?.averageReviewTime || 0} days
                </p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
                <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                  Approval Rate
                </p>
                <p style={{ margin: 0, color: '#10b981', fontSize: '20px', fontWeight: '700' }}>
                  {analytics?.approvalRate || 0}%
                </p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#fef2f2', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                  Pending
                </p>
                <p style={{ margin: 0, color: '#ef4444', fontSize: '20px', fontWeight: '700' }}>
                  {analytics?.pendingReviews || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
          <Link href="/dashboard/blogs">
            <button style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              📝 View All Blogs
            </button>
          </Link>
          <Link href="/dashboard">
            <button style={{
              padding: '12px 24px',
              backgroundColor: '#e5e7eb',
              color: '#1f2937',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '20px',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
            {title}
          </p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color }}>
            {value}
          </p>
        </div>
        <div style={{ fontSize: '24px' }}>{icon}</div>
      </div>
    </div>
  );
}
