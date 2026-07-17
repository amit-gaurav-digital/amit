'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AIHistoryPage() {
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedGen, setSelectedGen] = useState(null);
  const limit = 10;

  useEffect(() => {
    fetchGenerations();
  }, [filters, page]);

  const fetchGenerations = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/generations?${query}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGenerations(data.generations);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching generations:', err);
    } finally {
      setLoading(false);
    }
  };

  const pages = Math.ceil(total / limit);
  const getStatusColor = (status) => {
    const colors = {
      completed: '#10b981',
      generating: '#3b82f6',
      failed: '#ef4444',
      pending: '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  const getActionColor = (action) => {
    const colors = {
      saved_to_draft: '#10b981',
      saved_to_blog: '#0ea5e9',
      discarded: '#ef4444',
      regenerated: '#f59e0b',
      none: '#6b7280'
    };
    return colors[action] || '#6b7280';
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
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
                Generation History
              </h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                View all your AI generation requests
              </p>
            </div>
          </div>
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
            placeholder="Search by topic..."
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
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Loading generations...
            </div>
          ) : generations.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
              <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
                No generations found. Start generating content to see history here!
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Topic</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Type</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Tokens</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Cost</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Action</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>Date</th>
                  <th style={{ padding: '15px', textAlign: 'center', color: '#6b7280', fontWeight: '600', fontSize: '13px' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {generations.map((gen, idx) => (
                  <tr key={gen._id} style={{ borderBottom: idx === generations.length - 1 ? 'none' : '1px solid #e5e7eb' }}>
                    <td style={{ padding: '15px', color: '#1f2937', fontWeight: '500' }}>
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {gen.topic}
                      </div>
                    </td>
                    <td style={{ padding: '15px', color: '#6b7280', fontSize: '14px', textTransform: 'capitalize' }}>
                      {gen.generationType}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: getStatusColor(gen.status) + '20',
                        color: getStatusColor(gen.status),
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {gen.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px', color: '#6b7280' }}>
                      {gen.tokensUsed?.toLocaleString() || 0}
                    </td>
                    <td style={{ padding: '15px', color: '#6b7280' }}>
                      ${gen.costUsd?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {gen.actionTaken && (
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          backgroundColor: getActionColor(gen.actionTaken) + '20',
                          color: getActionColor(gen.actionTaken),
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {gen.actionTaken.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '15px', color: '#6b7280', fontSize: '13px' }}>
                      {new Date(gen.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedGen(selectedGen === gen._id ? null : gen._id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#e0e7ff',
                          color: '#3b82f6',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {selectedGen === gen._id ? 'Hide' : 'Show'}
                      </button>
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

        {/* Detail View */}
        {selectedGen && (
          <div style={{
            marginTop: '30px',
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
              Generation Details
            </h3>
            {generations.find(g => g._id === selectedGen) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
              }}>
                <div>
                  <label style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                    Title
                  </label>
                  <p style={{ color: '#1f2937', margin: 0, fontSize: '14px' }}>
                    {generations.find(g => g._id === selectedGen)?.title || 'N/A'}
                  </p>
                </div>
                <div>
                  <label style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                    Model
                  </label>
                  <p style={{ color: '#1f2937', margin: 0, fontSize: '14px' }}>
                    {generations.find(g => g._id === selectedGen)?.model || 'N/A'}
                  </p>
                </div>
                <div>
                  <label style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                    SEO Score
                  </label>
                  <p style={{ color: '#1f2937', margin: 0, fontSize: '14px' }}>
                    {generations.find(g => g._id === selectedGen)?.qualityMetrics?.seoScore || 0}/100
                  </p>
                </div>
                <div>
                  <label style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                    Readability Score
                  </label>
                  <p style={{ color: '#1f2937', margin: 0, fontSize: '14px' }}>
                    {generations.find(g => g._id === selectedGen)?.qualityMetrics?.readabilityScore || 0}/100
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
