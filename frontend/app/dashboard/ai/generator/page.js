'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AIGeneratorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    topic: '',
    keywords: '',
    tone: 'professional',
    length: 'medium',
    language: 'en',
    contentType: 'blog_post',
    targetAudience: '',
    instructions: ''
  });

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [quota, setQuota] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/usage`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setQuota(data);
      }
    } catch (err) {
      console.error('Error fetching quota:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateContent = async (e) => {
    e.preventDefault();

    if (!formData.topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    const keywordArray = formData.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k);

    if (keywordArray.length === 0) {
      setError('Please enter at least one keyword');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/generate/full-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            topic: formData.topic,
            keywords: keywordArray,
            tone: formData.tone,
            length: formData.length,
            language: formData.language,
            contentType: formData.contentType,
            targetAudience: formData.targetAudience,
            instructions: formData.instructions
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate content');
        return;
      }

      setResult(data);
      fetchQuota();
    } catch (err) {
      setError('Error generating content: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToBlog = async () => {
    if (!result?.generationRequestId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/generation/${result.generationRequestId}/save-to-blog`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            title: result.title,
            content: result.content,
            excerpt: result.excerpt,
            keywords: result.keywords
          })
        }
      );

      if (response.ok) {
        alert('Content saved to blog as draft!');
        setResult(null);
        setFormData({
          topic: '',
          keywords: '',
          tone: 'professional',
          length: 'medium',
          language: 'en',
          contentType: 'blog_post',
          targetAudience: '',
          instructions: ''
        });
      } else {
        alert('Failed to save to blog');
      }
    } catch (err) {
      alert('Error saving to blog: ' + err.message);
    }
  };

  const quotaPercentage = quota ? Math.round((quota.usage.tokensUsed / quota.quota.tokenQuota) * 100) : 0;
  const generationPercentage = quota ? Math.round((quota.usage.generationsUsed / quota.quota.generationQuota) * 100) : 0;

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>
            AI Blog Generator
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Generate high-quality blog content using AI
          </p>
        </div>

        {/* Quota Status */}
        {!loading && quota && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600' }}>
                  Tokens: {quota.usage.tokensUsed.toLocaleString()} / {quota.quota.tokensRemaining.toLocaleString()}
                </span>
                <span style={{ color: '#6b7280', fontSize: '13px' }}>{quotaPercentage}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${quotaPercentage}%`,
                  backgroundColor: quotaPercentage > 80 ? '#ef4444' : quotaPercentage > 60 ? '#f59e0b' : '#10b981'
                }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600' }}>
                  Generations: {quota.usage.generationsUsed} / {quota.quota.generationsRemaining}
                </span>
                <span style={{ color: '#6b7280', fontSize: '13px' }}>{generationPercentage}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${generationPercentage}%`,
                  backgroundColor: generationPercentage > 80 ? '#ef4444' : generationPercentage > 60 ? '#f59e0b' : '#10b981'
                }}></div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Form */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
              Content Parameters
            </h2>

            <form onSubmit={handleGenerateContent}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Topic *
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., Best Practices for SEO"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Keywords (comma-separated) *
                </label>
                <textarea
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="e.g., SEO, keywords, optimization, ranking"
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Tone
                </label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="academic">Academic</option>
                  <option value="conversational">Conversational</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                    Length
                  </label>
                  <select
                    name="length"
                    value={formData.length}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="short">Short (800-1000 words)</option>
                    <option value="medium">Medium (1500-2000 words)</option>
                    <option value="long">Long (3000-4000 words)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                    Language
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Target Audience
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  placeholder="e.g., Tech entrepreneurs, Digital marketers"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Additional Instructions
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  placeholder="Any specific instructions or guidelines"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={generating}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: generating ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {generating ? '⏳ Generating...' : '✨ Generate Content'}
              </button>
            </form>
          </div>

          {/* Preview */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
              Generated Content Preview
            </h2>

            {!result ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Fill in the form and click "Generate Content" to see the preview here
                </p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                    {result.title}
                  </h3>
                  <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
                    {result.excerpt}
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px'
                }}>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>SEO Score</span>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                      {result.metrics?.seoScore || 0}/100
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Readability</span>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                      {result.metrics?.readabilityScore || 0}/100
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Word Count</span>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                      {result.metrics?.wordCount || 0}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Read Time</span>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>
                      {result.metrics?.estimatedReadTime || 0} min
                    </div>
                  </div>
                </div>

                <div style={{
                  maxHeight: '250px',
                  overflowY: 'auto',
                  padding: '15px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#374151'
                }}>
                  {result.content}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleSaveToBlog}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    ✓ Save to Blog
                  </button>
                  <button
                    onClick={() => setResult(null)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    ✕ Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
