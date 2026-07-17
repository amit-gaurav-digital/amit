'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import authAPI from '@/lib/auth-api';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      fetchDashboardData(parsed._id);
    }
  }, [router]);

  const fetchDashboardData = async (clientId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}/dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#666' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '260px' : '80px',
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '20px',
        transition: 'width 0.3s ease',
        borderRight: '1px solid #374151'
      }}>
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #374151' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            {sidebarOpen ? 'AI Blog' : '📝'}
          </h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink href="/dashboard" icon="📊" label="Dashboard" open={sidebarOpen} active />
          <NavLink href="/dashboard/blogs" icon="📝" label="Blogs" open={sidebarOpen} />
          <NavLink href="/dashboard/ai/generator" icon="✨" label="AI Generator" open={sidebarOpen} />
          <NavLink href="/dashboard/schedule" icon="📅" label="Schedule" open={sidebarOpen} />
          <NavLink href="/dashboard/analytics" icon="📈" label="Analytics" open={sidebarOpen} />
          <NavLink href="/dashboard/settings" icon="⚙️" label="Settings" open={sidebarOpen} />
        </nav>

        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #374151' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Top Bar */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px 30px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#1f2937' }}>Dashboard</h2>
            <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Welcome back, {user?.name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link href="/dashboard/ai/generator">
              <button style={{
                padding: '10px 20px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                ✨ AI Generator
              </button>
            </Link>
            <Link href="/dashboard/blogs/create">
              <button style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                + New Blog
              </button>
            </Link>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              👤
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div style={{ padding: '30px' }}>
          {/* AI Features Quick Access */}
          <div style={{
            backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '30px',
            color: 'white'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
              ✨ AI Content Generation
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px'
            }}>
              <AIFeatureLink href="/dashboard/ai/generator" label="Generate" icon="✨" />
              <AIFeatureLink href="/dashboard/ai/refine" label="Refine" icon="🔧" />
              <AIFeatureLink href="/dashboard/ai/variants" label="Variants" icon="🔄" />
              <AIFeatureLink href="/dashboard/ai/usage" label="Usage" icon="📊" />
              <AIFeatureLink href="/dashboard/ai/history" label="History" icon="📋" />
              <AIFeatureLink href="/dashboard/ai/settings" label="Settings" icon="⚙️" />
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatCard
              title="Total Blogs"
              value={dashboardData?.stats?.totalBlogs || 0}
              color="#3b82f6"
              icon="📝"
            />
            <StatCard
              title="Published"
              value={dashboardData?.stats?.publishedBlogs || 0}
              color="#10b981"
              icon="✅"
            />
            <StatCard
              title="Scheduled"
              value={dashboardData?.stats?.scheduledBlogs || 0}
              color="#f59e0b"
              icon="📅"
            />
            <StatCard
              title="Drafts"
              value={dashboardData?.stats?.drafts || 0}
              color="#8b5cf6"
              icon="📄"
            />
          </div>

          {/* Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* Recent Blogs */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                Recent Blogs
              </h3>
              {dashboardData?.recentBlogs && dashboardData.recentBlogs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {dashboardData.recentBlogs.map(blog => (
                    <div key={blog._id} style={{
                      padding: '12px',
                      borderLeft: '3px solid #3b82f6',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 5px 0', color: '#1f2937', fontWeight: '500' }}>
                            {blog.title}
                          </p>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              backgroundColor: getStatusColor(blog.status),
                              color: 'white',
                              borderRadius: '3px',
                              fontSize: '11px',
                              textTransform: 'capitalize'
                            }}>
                              {blog.status}
                            </span>
                          </p>
                        </div>
                        <p style={{ margin: 0, color: '#3b82f6', fontWeight: '500', fontSize: '13px' }}>
                          {blog.views} views
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 20px' }}>
                  No blogs yet. Create your first blog!
                </p>
              )}
            </div>

            {/* Upcoming Scheduled */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                Upcoming
              </h3>
              {dashboardData?.upcomingScheduled && dashboardData.upcomingScheduled.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dashboardData.upcomingScheduled.map(blog => (
                    <div key={blog._id} style={{
                      padding: '12px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '4px',
                      borderLeft: '3px solid #f59e0b'
                    }}>
                      <p style={{ margin: '0 0 5px 0', color: '#1f2937', fontWeight: '500', fontSize: '13px' }}>
                        {blog.title}
                      </p>
                      <p style={{ margin: 0, color: '#92400e', fontSize: '12px' }}>
                        📅 {new Date(blog.scheduledFor).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '30px 10px', fontSize: '13px' }}>
                  No scheduled blogs
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon }) {
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

function NavLink({ href, icon, label, open, active }) {
  return (
    <Link href={href}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        backgroundColor: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        color: active ? '#3b82f6' : '#d1d5db',
        transition: 'all 0.2s ease',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: active ? '600' : '400'
      }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        {open && <span>{label}</span>}
      </div>
    </Link>
  );
}

function AIFeatureLink({ href, label, icon }) {
  return (
    <Link href={href}>
      <div style={{
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textDecoration: 'none',
        color: 'white'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
        <div style={{ fontSize: '13px', fontWeight: '600' }}>{label}</div>
      </div>
    </Link>
  );
}

function getStatusColor(status) {
  const colors = {
    draft: '#8b5cf6',
    in_review: '#f59e0b',
    scheduled: '#0ea5e9',
    published: '#10b981',
    archived: '#6b7280'
  };
  return colors[status] || '#6b7280';
}
