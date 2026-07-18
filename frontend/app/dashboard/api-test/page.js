'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ApiTestPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>;
  }
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name, method = 'GET', body = null) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/blogs`;
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const data = await response.json();

      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          ok: response.ok,
          duration: `${duration}ms`,
          data,
          url,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    await testEndpoint('GET /blogs');
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Link href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Dashboard
        </Link>

        <h1 style={{ marginTop: '20px', color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>
          API Diagnostic Test
        </h1>

        {/* Environment Info */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
            Environment Configuration
          </h2>
          <div style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '6px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Token Present:</strong> {localStorage.getItem('token') ? '✓ Yes' : '✗ No'}
            </div>
            <div>
              <strong>User:</strong> {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Not found'}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
            Test API Connection
          </h2>
          <button
            onClick={handleTestConnection}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Results */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
            Test Results
          </h2>
          {Object.keys(results).length === 0 ? (
            <p style={{ color: '#6b7280' }}>Click "Test Connection" to run diagnostics</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Object.entries(results).map(([name, result]) => (
                <div key={name} style={{
                  border: `1px solid ${result.error ? '#fca5a5' : '#d1d5db'}`,
                  borderRadius: '6px',
                  padding: '15px',
                  backgroundColor: result.error ? '#fef2f2' : '#f9fafb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <strong style={{ color: '#1f2937' }}>{name}</strong>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {result.timestamp}
                    </span>
                  </div>

                  {result.error ? (
                    <div style={{ color: '#dc2626', fontFamily: 'monospace', fontSize: '13px' }}>
                      ✗ Error: {result.error}
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: '10px', display: 'flex', gap: '20px' }}>
                        <span style={{
                          backgroundColor: result.ok ? '#dcfce7' : '#fee2e2',
                          color: result.ok ? '#15803d' : '#dc2626',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Status: {result.status}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>
                          Duration: {result.duration}
                        </span>
                      </div>

                      <details style={{ marginTop: '10px' }}>
                        <summary style={{
                          cursor: 'pointer',
                          color: '#3b82f6',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>
                          Response Data
                        </summary>
                        <pre style={{
                          backgroundColor: '#f3f4f6',
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          overflow: 'auto',
                          marginTop: '10px'
                        }}>
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>

                      <details style={{ marginTop: '10px' }}>
                        <summary style={{
                          cursor: 'pointer',
                          color: '#3b82f6',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>
                          Endpoint URL
                        </summary>
                        <pre style={{
                          backgroundColor: '#f3f4f6',
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          overflow: 'auto',
                          marginTop: '10px',
                          wordBreak: 'break-all'
                        }}>
                          {result.url}
                        </pre>
                      </details>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
