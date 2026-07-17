'use client';

import { useState } from 'react';

export default function GoogleAnalyticsConnect({
  blogId,
  onConnect = () => {},
  connected = false
}) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/google/auth-url`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (!response.ok) throw new Error('Failed to get auth URL');

      const { authUrl } = await response.json();

      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'googleAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          onConnect();
          setConnecting(false);
        }
      }, 1000);
    } catch (err) {
      setError(err.message);
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
      <h3 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>🔗 Google Analytics</h3>

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
          <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>Connected to Google Analytics</p>
        </div>
      ) : (
        <>
          <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#6b7280' }}>
            Connect your Google Analytics account to get real-time metrics and insights.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            style={{
              padding: '10px 16px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: connecting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: connecting ? 0.7 : 1
            }}
          >
            {connecting ? '⏳ Connecting...' : '🔐 Connect Google Analytics'}
          </button>
        </>
      )}
    </div>
  );
}
