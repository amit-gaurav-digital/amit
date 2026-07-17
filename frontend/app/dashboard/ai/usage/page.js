'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AIUsagePage() {
  const [stats, setStats] = useState(null);
  const [dailyUsage, setDailyUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchStats();
  }, [month]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, dailyRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/usage?month=${month}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/usage/daily?month=${month}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (dailyRes.ok) {
        const data = await dailyRes.json();
        setDailyUsage(data);
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center' }}>Loading usage statistics...</div>;
  }

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link href="/dashboard/ai/generator">
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  ← Back
                </button>
              </Link>
              <div>
                <h1 style={{ margin: '0 0 5px 0', color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>
                  Usage & Analytics
                </h1>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  Track your AI generation usage and costs
                </p>
              </div>
            </div>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        {stats && (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Tokens Used
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                  {stats.usage.tokensUsed.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                  {stats.percentageUsed.tokens}% of quota
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Generations Used
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {stats.usage.generationsUsed}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                  {stats.percentageUsed.generations}% of quota
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Cost (USD)
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                  ${stats.usage.costUsd.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                  {stats.percentageUsed.cost}% of limit
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Remaining Budget
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                  ${stats.quota.costRemaining.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                  of ${stats.quota.costLimit.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '30px'
            }}>
              <h2 style={{ margin: '0 0 25px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                Quota Usage
              </h2>

              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#374151', fontSize: '14px', fontWeight: '600' }}>Tokens</span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>
                    {stats.usage.tokensUsed.toLocaleString()} / {stats.quota.tokenQuota.toLocaleString()}
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, stats.percentageUsed.tokens)}%`,
                    backgroundColor: stats.percentageUsed.tokens > 80 ? '#ef4444' : stats.percentageUsed.tokens > 60 ? '#f59e0b' : '#10b981'
                  }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#374151', fontSize: '14px', fontWeight: '600' }}>Generations</span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>
                    {stats.usage.generationsUsed} / {stats.quota.generationQuota}
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, stats.percentageUsed.generations)}%`,
                    backgroundColor: stats.percentageUsed.generations > 80 ? '#ef4444' : stats.percentageUsed.generations > 60 ? '#f59e0b' : '#10b981'
                  }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#374151', fontSize: '14px', fontWeight: '600' }}>Cost</span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>
                    ${stats.usage.costUsd.toFixed(2)} / ${stats.quota.costLimit.toFixed(2)}
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, stats.percentageUsed.cost)}%`,
                    backgroundColor: stats.percentageUsed.cost > 80 ? '#ef4444' : stats.percentageUsed.cost > 60 ? '#f59e0b' : '#10b981'
                  }}></div>
                </div>
              </div>
            </div>

            {/* Generation Types */}
            {Object.keys(stats.usage.generationsByType || {}).length > 0 && (
              <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '30px'
              }}>
                <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                  Usage by Type
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Count</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Tokens</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.usage.generationsByType || {}).map(([type, data]) => (
                      <tr key={type} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px', textTransform: 'capitalize' }}>
                          {type}
                        </td>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>
                          {data.count}
                        </td>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>
                          {data.tokensUsed.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>
                          ${data.costUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Daily Usage */}
            {dailyUsage.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                  Daily Breakdown
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Generations</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Tokens</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyUsage.map((day, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>
                          {day.generationCount}
                        </td>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>
                          {day.tokensUsed.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>
                          ${day.costUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
