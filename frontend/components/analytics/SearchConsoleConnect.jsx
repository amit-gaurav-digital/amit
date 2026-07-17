'use client';

import { useState } from 'react';

export default function SearchConsoleConnect({
  blogId,
  onConnect = () => {},
  connected = false
}) {
  const [connecting, setConnecting] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    try {
      if (!siteUrl) {
        setError('Please enter your website URL');
        return;
      }

      setConnecting(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/search-console/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ blogId, siteUrl })
        }
      );

      if (!response.ok) throw new Error('Failed to connect to Search Console');

      onConnect();
      setSiteUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '20px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>🔍 Google Search Console</h3>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {connected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' }} />
          <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>Connected to Search Console</p>
        </div>
      ) : (
        <>
          <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#6b7280' }}>
            Connect your website to Google Search Console for SEO metrics.
          </p>
          <div style={{ display: 'grid', gap: '10px' }}>
            <input
              type="url"
              placeholder="https://example.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={handleConnect}
              disabled={connecting || !siteUrl}
              style={{
                padding: '10px 16px',
                backgroundColor: '#34a853',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: connecting || !siteUrl ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: connecting || !siteUrl ? 0.7 : 1
              }}
            >
              {connecting ? '⏳ Connecting...' : '🔐 Connect Search Console'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
