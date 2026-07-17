'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function BlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: ''
    }
  });

  useEffect(() => {
    fetchBlog();
    fetchReviewers();
  }, [params.blogId]);

  const fetchBlog = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${params.blogId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        const blog = data.blog || data;
        setBlog(blog);
        setFormData({
          title: blog.title || '',
          excerpt: blog.excerpt || '',
          content: blog.content || '',
          category: blog.category || '',
          tags: blog.tags?.join(', ') || '',
          seo: {
            metaTitle: blog.seo?.metaTitle || '',
            metaDescription: blog.seo?.metaDescription || '',
            keywords: blog.seo?.keywords?.join(', ') || ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=reviewer,approver`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReviewers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching reviewers:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setEditing(true);
  };

  const handleSEOChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value
      }
    }));
    setEditing(true);
  };

  const handleSaveBlog = async () => {
    try {
      setSaveStatus('Saving...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${params.blogId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          seo: {
            ...formData.seo,
            keywords: formData.seo.keywords.split(',').map(k => k.trim()).filter(k => k)
          }
        })
      });

      if (response.ok) {
        setSaveStatus('Saved ✓');
        setEditing(false);
        await fetchBlog();
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      setSaveStatus('Error saving');
    }
  };

  const handleSubmitReview = async () => {
    if (selectedReviewers.length === 0) {
      alert('Please select at least one reviewer');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflow/blogs/${params.blogId}/workflow/submit-review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            reviewers: selectedReviewers,
            notes: reviewNotes,
            priority: 'normal'
          })
        }
      );

      if (response.ok) {
        alert('Blog submitted for review!');
        setShowReviewDialog(false);
        await fetchBlog();
      }
    } catch (error) {
      console.error('Error submitting for review:', error);
      alert('Failed to submit for review');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <p>Loading blog...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={{ padding: '30px' }}>
        <p style={{ color: '#6b7280' }}>Blog not found</p>
        <Link href="/dashboard/blogs">
          <button style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Back to Blogs
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <Link href="/dashboard/blogs">
              <span style={{ color: '#3b82f6', cursor: 'pointer', fontSize: '14px', marginBottom: '10px', display: 'inline-block' }}>
                ← Back to Blogs
              </span>
            </Link>
            <h1 style={{ margin: '10px 0', color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>
              Edit Blog
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {saveStatus && (
              <span style={{ color: saveStatus.includes('Error') ? '#ef4444' : '#10b981', fontSize: '14px', fontWeight: '600' }}>
                {saveStatus}
              </span>
            )}
            {editing && (
              <button
                onClick={handleSaveBlog}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                💾 Save Draft
              </button>
            )}
            {blog.status === 'draft' && (
              <button
                onClick={() => setShowReviewDialog(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                📤 Submit for Review
              </button>
            )}
            {blog.status === 'in_review' && (
              <Link href={`/dashboard/blogs/${params.blogId}/review`}>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}>
                  👁️ View Review
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 12px',
            backgroundColor: getStatusBg(blog.status),
            color: getStatusText(blog.status),
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {blog.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {/* Main Content */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '25px' }}>
            {/* Title */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter blog title..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              />
            </div>

            {/* Category and Tags */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Technology"
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
                <label style={{ display: 'block', marginBottom: '8px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., AI, automation, blog"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Excerpt */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                Excerpt
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                placeholder="Brief summary of the blog..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  minHeight: '80px'
                }}
              />
            </div>

            {/* Content */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                Content
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Write your blog content here..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  minHeight: '400px'
                }}
              />
            </div>

            {/* SEO Section */}
            <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                SEO Settings
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo.metaTitle}
                    onChange={(e) => handleSEOChange('metaTitle', e.target.value)}
                    placeholder="SEO title (50-60 characters)"
                    maxLength="60"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
                    {formData.seo.metaTitle.length}/60
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                    Meta Description
                  </label>
                  <textarea
                    value={formData.seo.metaDescription}
                    onChange={(e) => handleSEOChange('metaDescription', e.target.value)}
                    placeholder="Meta description (150-160 characters)"
                    maxLength="160"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      minHeight: '60px'
                    }}
                  />
                  <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
                    {formData.seo.metaDescription.length}/160
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.seo.keywords}
                    onChange={(e) => handleSEOChange('keywords', e.target.value)}
                    placeholder="e.g., automation, AI, business"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      {showReviewDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            padding: '30px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px', fontWeight: '700' }}>
              Submit for Review
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                Select Reviewers
              </label>
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                {reviewers.length > 0 ? (
                  reviewers.map(reviewer => (
                    <label key={reviewer._id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      backgroundColor: selectedReviewers.includes(reviewer._id) ? '#f0f9ff' : 'white'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedReviewers.includes(reviewer._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReviewers([...selectedReviewers, reviewer._id]);
                          } else {
                            setSelectedReviewers(selectedReviewers.filter(id => id !== reviewer._id));
                          }
                        }}
                        style={{ marginRight: '10px', cursor: 'pointer' }}
                      />
                      <div>
                        <p style={{ margin: 0, color: '#1f2937', fontWeight: '500' }}>{reviewer.name}</p>
                        <p style={{ margin: '2px 0 0 0', color: '#6b7280', fontSize: '12px' }}>{reviewer.email}</p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p style={{ padding: '20px', color: '#6b7280', textAlign: 'center' }}>
                    No reviewers available
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                Review Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes for the reviewers..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  minHeight: '100px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReviewDialog(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}
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
