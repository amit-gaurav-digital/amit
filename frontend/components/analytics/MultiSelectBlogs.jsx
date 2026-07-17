'use client';

import { useState, useEffect } from 'react';

export default function MultiSelectBlogs({ blogs, token, onSelect }) {
  const [selectedBlogs, setSelectedBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [integrationStatus, setIntegrationStatus] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (blogs.length > 0) {
      fetchIntegrationStatus();
    }
  }, [blogs]);

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const statusMap = {};

      for (const blog of blogs) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/integrations/status/${blog._id}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          if (response.ok) {
            const data = await response.json();
            statusMap[blog._id] = data;
          }
        } catch (err) {
          console.error(`Failed to fetch status for blog ${blog._id}:`, err);
        }
      }

      setIntegrationStatus(statusMap);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleBlog = (blog) => {
    let updated;

    if (selectedBlogs.find(b => b._id === blog._id)) {
      updated = selectedBlogs.filter(b => b._id !== blog._id);
    } else {
      if (selectedBlogs.length < 5) {
        updated = [...selectedBlogs, blog];
      } else {
        alert('You can compare a maximum of 5 blogs');
        return;
      }
    }

    setSelectedBlogs(updated);
    onSelect(updated);
  };

  const handleSelectAll = () => {
    if (selectedBlogs.length === filteredBlogs.length) {
      setSelectedBlogs([]);
      onSelect([]);
    } else {
      const toAdd = filteredBlogs.slice(0, 5);
      setSelectedBlogs(toAdd);
      onSelect(toAdd);
    }
  };

  const getStatusColor = (status) => {
    if (status?.googleAnalytics?.connected && status?.searchConsole?.connected) return '#10b981';
    if (status?.googleAnalytics?.connected) return '#3b82f6';
    if (status?.searchConsole?.connected) return '#8b5cf6';
    return '#d1d5db';
  };

  const getStatusText = (status) => {
    const gaConnected = status?.googleAnalytics?.connected === true;
    const scConnected = status?.searchConsole?.connected === true;

    if (gaConnected && scConnected) return 'GA & SC';
    if (gaConnected) return 'GA Only';
    if (scConnected) return 'SC Only';
    return 'Not Connected';
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        color: '#1f2937',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        Select Blogs
      </h3>

      {/* Search Bar */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search blogs by title or URL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Select All Button */}
      <button
        onClick={handleSelectAll}
        disabled={filteredBlogs.length === 0}
        style={{
          width: '100%',
          padding: '10px 12px',
          backgroundColor: selectedBlogs.length === filteredBlogs.length && filteredBlogs.length > 0
            ? '#3b82f6'
            : '#f3f4f6',
          color: selectedBlogs.length === filteredBlogs.length && filteredBlogs.length > 0
            ? 'white'
            : '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: filteredBlogs.length === 0 ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: '500',
          marginBottom: '16px',
          transition: 'all 0.2s'
        }}
      >
        {selectedBlogs.length === filteredBlogs.length && filteredBlogs.length > 0
          ? '✓ All Selected'
          : 'Select All'}
      </button>

      {/* Blogs List */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '6px'
      }}>
        {loading ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Loading integration status...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            No blogs found matching your search
          </div>
        ) : (
          filteredBlogs.map((blog) => {
            const isSelected = selectedBlogs.find(b => b._id === blog._id);
            const status = integrationStatus[blog._id];

            return (
              <div
                key={blog._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: isSelected ? '#f0f9ff' : 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  ':hover': {
                    backgroundColor: '#f9fafb'
                  }
                }}
                onClick={() => handleToggleBlog(blog)}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  style={{
                    marginRight: '12px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                  disabled={selectedBlogs.length >= 5 && !isSelected}
                />

                {/* Blog Info */}
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: '0 0 4px 0',
                    color: '#1f2937',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    {blog.title}
                  </p>
                  <p style={{
                    margin: '0 0 6px 0',
                    color: '#6b7280',
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {blog.url}
                  </p>

                  {/* Status and Sync Info */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#374151',
                      fontWeight: '500'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(status)
                      }}></span>
                      {getStatusText(status)}
                    </span>

                    {status?.googleAnalytics?.connected && status?.googleAnalytics?.lastSync && (
                      <span style={{
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        GA: {formatLastSync(status.googleAnalytics.lastSync)}
                      </span>
                    )}

                    {status?.searchConsole?.connected && status?.searchConsole?.lastSync && (
                      <span style={{
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        SC: {formatLastSync(status.searchConsole.lastSync)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Selection Count Indicator */}
                {isSelected && (
                  <div style={{
                    marginLeft: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {selectedBlogs.findIndex(b => b._id === blog._id) + 1}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Selection Limit Indicator */}
      <div style={{
        marginTop: '12px',
        padding: '8px 12px',
        backgroundColor: selectedBlogs.length >= 5 ? '#fef3c7' : '#f3f4f6',
        borderRadius: '6px',
        fontSize: '12px',
        color: selectedBlogs.length >= 5 ? '#92400e' : '#6b7280',
        textAlign: 'center'
      }}>
        {selectedBlogs.length} / 5 blogs selected
      </div>
    </div>
  );
}
