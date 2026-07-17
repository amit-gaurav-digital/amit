'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import BarChart from '@/components/analytics/BarChart';
import PieChart from '@/components/analytics/PieChart';
import TrendChart from '@/components/analytics/TrendChart';
import MetricsTable from '@/components/analytics/MetricsTable';
import SegmentFilter from '@/components/analytics/SegmentFilter';
import ExportModal from '@/components/analytics/ExportModal';

export default function BlogAnalyticsDetail() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.blogId;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportOpen, setExportOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    fetchData(startDate, endDate);
  }, [router]);

  const fetchData = async (startDate, endDate) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/blog/${blogId}/detail?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        setDateRange({ start: startDate, end: endDate });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (start, end) => {
    fetchData(start, end);
  };

  const handleExport = async (options) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/export/${blogId}?startDate=${dateRange.start?.toISOString()}&endDate=${dateRange.end?.toISOString()}&format=${options.format}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${blogId}-${Date.now()}.${options.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '15px' }}>📊</div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
        <p>No analytics data available</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📈 Overview' },
    { id: 'performance', label: '⚡ Performance' },
    { id: 'engagement', label: '💬 Engagement' },
    { id: 'geography', label: '🌍 Geography' },
    { id: 'referrers', label: '🔗 Referrers' },
    { id: 'growth', label: '📊 Growth' }
  ];

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>📊 {data.blog?.title || 'Blog'} Analytics</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          {dateRange.start?.toLocaleDateString()} - {dateRange.end?.toLocaleDateString()}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <DateRangePicker onDateRangeChange={handleDateRangeChange} />

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          <button
            onClick={() => setExportOpen(true)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            📥 Export Data
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <MetricCard title="Total Views" value={data.summary?.totalViews} icon="👁️" color="#3b82f6" />
        <MetricCard title="Total Visitors" value={data.summary?.totalVisitors} icon="👥" color="#8b5cf6" />
        <MetricCard title="Avg Bounce Rate" value={data.summary?.avgBounceRate?.toFixed(1)} icon="🚫" color="#f59e0b" suffix="%" />
        <MetricCard title="Sessions" value={data.summary?.totalSessions} icon="📌" color="#10b981" />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '1px solid #e5e7eb',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: '30px' }}>
          <TrendChart
            data={data.daily || []}
            dataKey="views"
            title="Views Trend"
            color="#3b82f6"
            height={300}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <BarChart
              data={Object.fromEntries(data.deviceBreakdown?.map(d => [d.device, d.views]) || [])}
              title="Traffic by Device"
              colors={{ desktop: '#3b82f6', mobile: '#10b981', tablet: '#f59e0b' }}
            />

            <PieChart
              data={Object.fromEntries(data.trafficSources?.map(s => [s.source, s.views]) || [])}
              title="Traffic by Source"
              colors={{
                organic: '#10b981',
                direct: '#3b82f6',
                referral: '#f59e0b',
                social: '#8b5cf6',
                email: '#ec4899',
                paid: '#14b8a6'
              }}
            />
          </div>

          <MetricsTable
            data={data.topPages || []}
            columns={[
              { key: 'url', label: 'Page URL' },
              { key: 'events', label: 'Events', align: 'right' }
            ]}
            title="Top Pages"
          />
        </div>
      )}

      {activeTab === 'performance' && (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
          <p>Performance metrics loading...</p>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
          <p>Engagement analysis loading...</p>
        </div>
      )}

      {activeTab === 'geography' && (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
          <p>Geographic data loading...</p>
        </div>
      )}

      {activeTab === 'referrers' && (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
          <p>Referrer analysis loading...</p>
        </div>
      )}

      {activeTab === 'growth' && (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
          <p>Growth comparison loading...</p>
        </div>
      )}

      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        blogId={blogId}
      />
    </div>
  );
}

function MetricCard({ title, value, icon, color, suffix = '' }) {
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
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color }}>
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
        <div style={{ fontSize: '24px' }}>{icon}</div>
      </div>
    </div>
  );
}
