'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function BlogReviewPage() {
  const router = useRouter();
  const params = useParams();
  const [blog, setBlog] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('content');
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [changeRequestText, setChangeRequestText] = useState('');
  const [changeRequestSection, setChangeRequestSection] = useState('');
  const [changePriority, setChangePriority] = useState('medium');

  useEffect(() => {
    fetchBlogAndWorkflow();
  }, [params.blogId]);

  const fetchBlogAndWorkflow = async () => {
    try {
      setLoading(true);
      const [blogRes, workflowRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${params.blogId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflow/blogs/${params.blogId}/workflow`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (blogRes.ok) setBlog(await blogRes.json());
      if (workflowRes.ok) setWorkflow(await workflowRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflow/blogs/${params.blogId}/workflow/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ text: comment })
        }
      );

      if (response.ok) {
        setComment('');
        fetchBlogAndWorkflow();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleRequestChanges = async (e) => {
    e.preventDefault();
    if (!changeRequestText.trim()) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflow/blogs/${params.blogId}/workflow/request-changes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            description: changeRequestText,
            section: changeRequestSection,
            priority: changePriority
          })
        }
      );

      if (response.ok) {
        setChangeRequestText('');
        setShowChangeRequest(false);
        fetchBlogAndWorkflow();
      }
    } catch (error) {
      console.error('Error requesting changes:', error);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflow/blogs/${params.blogId}/workflow/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ feedback: '' })
        }
      );

      if (response.ok) {
        alert('Blog approved successfully!');
        fetchBlogAndWorkflow();
      }
    } catch (error) {
      console.error('Error approving blog:', error);
      alert('Failed to approve blog');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflow/blogs/${params.blogId}/workflow/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ reason })
        }
      );

      if (response.ok) {
        alert('Blog rejected successfully!');
        fetchBlogAndWorkflow();
      }
    } catch (error) {
      console.error('Error rejecting blog:', error);
      alert('Failed to reject blog');
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish this blog now?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflow/blogs/${params.blogId}/workflow/publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        alert('Blog published successfully!');
        router.push('/dashboard/blogs');
      }
    } catch (error) {
      console.error('Error publishing blog:', error);
      alert('Failed to publish blog');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <p>Loading review data...</p>
      </div>
    );
  }

  if (!blog || !workflow) {
    return (
      <div style={{ padding: '30px' }}>
        <p style={{ color: '#6b7280' }}>Blog or workflow not found</p>
        <Link href="/dashboard/blogs">
          <button style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Back to Blogs
          </button>
        </Link>
      </div>
    );
  }

  const blogData = blog.blog || blog;

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <Link href="/dashboard/blogs">
            <span style={{ color: '#3b82f6', cursor: 'pointer', fontSize: '14px', marginBottom: '15px', display: 'inline-block' }}>
              ← Back to Blogs
            </span>
          </Link>
          <h1 style={{ margin: '10px 0', color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>
            {blogData.title}
          </h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '10px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: getStatusBg(blogData.status),
              color: getStatusText(blogData.status),
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {blogData.status}
            </span>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              {blogData.readTime} min read
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Main Content */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Tabs */}
            <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex' }}>
              {['content', 'comments', 'changes'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: activeTab === tab ? 'white' : '#f9fafb',
                    color: activeTab === tab ? '#3b82f6' : '#6b7280',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab ? '600' : '400',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div style={{ padding: '20px' }}>
                <h2 style={{ color: '#1f2937', fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
                  Blog Content
                </h2>
                {blogData.excerpt && (
                  <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                      Excerpt
                    </h3>
                    <p style={{ margin: 0, color: '#1f2937' }}>{blogData.excerpt}</p>
                  </div>
                )}
                <div style={{
                  color: '#1f2937',
                  lineHeight: '1.8',
                  fontSize: '15px',
                  maxHeight: '600px',
                  overflowY: 'auto'
                }}>
                  {blogData.content}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div style={{ padding: '20px' }}>
                <h2 style={{ color: '#1f2937', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                  Comments & Feedback
                </h2>

                {/* Comment List */}
                <div style={{ marginBottom: '30px', maxHeight: '400px', overflowY: 'auto' }}>
                  {workflow.workflow?.comments && workflow.workflow.comments.length > 0 ? (
                    workflow.workflow.comments.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '15px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          borderLeft: '3px solid #3b82f6'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <p style={{ margin: '0 0 2px 0', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                              {c.author?.name || 'Unknown'}
                            </p>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>
                              {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            backgroundColor: getRoleBg(c.author?.role),
                            color: 'white',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {c.author?.role}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: '#1f2937', lineHeight: '1.6' }}>{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No comments yet</p>
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      marginTop: '10px',
                      padding: '10px 20px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Add Comment
                  </button>
                </form>
              </div>
            )}

            {/* Changes Tab */}
            {activeTab === 'changes' && (
              <div style={{ padding: '20px' }}>
                <h2 style={{ color: '#1f2937', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                  Requested Changes
                </h2>

                {workflow.workflow?.changeRequests && workflow.workflow.changeRequests.length > 0 ? (
                  <div style={{ marginBottom: '30px' }}>
                    {workflow.workflow.changeRequests.map((cr, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '15px',
                          backgroundColor: getPriorityBg(cr.priority),
                          borderRadius: '6px',
                          marginBottom: '12px',
                          borderLeft: `3px solid ${getPriorityColor(cr.priority)}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <p style={{ margin: '0 0 2px 0', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                              {cr.description}
                            </p>
                            {cr.section && (
                              <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>
                                Section: {cr.section}
                              </p>
                            )}
                          </div>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            backgroundColor: getPriorityColor(cr.priority),
                            color: 'white',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {cr.priority}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>
                          Status: {cr.status}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 20px' }}>
                    No change requests yet
                  </p>
                )}

                {!showChangeRequest && (
                  <button
                    onClick={() => setShowChangeRequest(true)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    + Request Changes
                  </button>
                )}

                {showChangeRequest && (
                  <form onSubmit={handleRequestChanges} style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                        Change Description
                      </label>
                      <textarea
                        value={changeRequestText}
                        onChange={(e) => setChangeRequestText(e.target.value)}
                        placeholder="Describe the changes needed..."
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          minHeight: '100px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                          Section (Optional)
                        </label>
                        <input
                          type="text"
                          value={changeRequestSection}
                          onChange={(e) => setChangeRequestSection(e.target.value)}
                          placeholder="e.g., Introduction, Conclusion"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                          Priority
                        </label>
                        <select
                          value={changePriority}
                          onChange={(e) => setChangePriority(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="submit"
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Submit Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowChangeRequest(false)}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#e5e7eb',
                          color: '#1f2937',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Blog Info Card */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '14px', fontWeight: '600' }}>
                Blog Info
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#6b7280' }}>
                <div>
                  <p style={{ margin: '0 0 3px 0', fontWeight: '600', color: '#1f2937' }}>Author</p>
                  <p style={{ margin: 0 }}>{blogData.author?.name}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 3px 0', fontWeight: '600', color: '#1f2937' }}>Category</p>
                  <p style={{ margin: 0 }}>{blogData.category}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 3px 0', fontWeight: '600', color: '#1f2937' }}>Created</p>
                  <p style={{ margin: 0 }}>{new Date(blogData.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Workflow Status Card */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '14px', fontWeight: '600' }}>
                Workflow Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                    Stage
                  </p>
                  <p style={{ margin: 0, color: '#1f2937', fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {workflow.workflow?.currentStage}
                  </p>
                </div>
                {workflow.workflow?.reviewers && workflow.workflow.reviewers.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                      Reviewers
                    </p>
                    {workflow.workflow.reviewers.map((r, idx) => (
                      <div key={idx} style={{
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px',
                        marginBottom: '6px',
                        fontSize: '12px'
                      }}>
                        <div style={{ color: '#1f2937', fontWeight: '500' }}>
                          {r.userId?.name || 'Reviewer'}
                        </div>
                        <div style={{
                          color: getReviewerStatusColor(r.status),
                          fontSize: '11px',
                          textTransform: 'capitalize'
                        }}>
                          {r.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {blogData.status === 'in_review' && (
                <>
                  <button
                    onClick={handleApprove}
                    style={{
                      padding: '12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setActiveTab('changes')}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    ! Request Changes
                  </button>
                  <button
                    onClick={handleReject}
                    style={{
                      padding: '12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    ✕ Reject
                  </button>
                </>
              )}
              {blogData.status === 'approved' && (
                <button
                  onClick={handlePublish}
                  style={{
                    padding: '12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  📤 Publish Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusBg(status) {
  const colors = {
    draft: '#f3f4f6',
    in_review: '#fef3c7',
    approved: '#dcfce7',
    published: '#dcfce7',
    archived: '#f3f4f6'
  };
  return colors[status] || '#f3f4f6';
}

function getStatusText(status) {
  const colors = {
    draft: '#6b7280',
    in_review: '#92400e',
    approved: '#15803d',
    published: '#15803d',
    archived: '#6b7280'
  };
  return colors[status] || '#6b7280';
}

function getRoleBg(role) {
  const colors = {
    admin: '#3b82f6',
    approver: '#8b5cf6',
    reviewer: '#10b981',
    writer: '#f59e0b'
  };
  return colors[role] || '#6b7280';
}

function getPriorityColor(priority) {
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6'
  };
  return colors[priority] || '#6b7280';
}

function getPriorityBg(priority) {
  const colors = {
    high: '#fee2e2',
    medium: '#fef3c7',
    low: '#dbeafe'
  };
  return colors[priority] || '#f3f4f6';
}

function getReviewerStatusColor(status) {
  const colors = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    changes_requested: '#f59e0b'
  };
  return colors[status] || '#6b7280';
}
