'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ margin: 0, color: '#333' }}>Dashboard</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>

        {/* User Info Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>Welcome, {user?.name}!</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Email</p>
              <p style={{ margin: 0, color: '#333', fontWeight: 'bold' }}>{user?.email}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Role</p>
              <p style={{ margin: 0, color: '#333', fontWeight: 'bold' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: user?.role === 'admin' ? '#28a745' : '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}>
                  {user?.role}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Blogs</h3>
            <p style={{ margin: 0, fontSize: '32px', color: '#007bff', fontWeight: 'bold' }}>0</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Pending Approvals</h3>
            <p style={{ margin: 0, fontSize: '32px', color: '#ffc107', fontWeight: 'bold' }}>0</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Published</h3>
            <p style={{ margin: 0, fontSize: '32px', color: '#28a745', fontWeight: 'bold' }}>0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
