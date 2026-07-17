'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AIRefineContentPage() {
  const [content, setContent] = useState('');
  const [refinementType, setRefinementType] = useState('improve');
  const [tone, setTone] = useState('professional');
  const [targetLength, setTargetLength] = useState('');
  const [instructions, setInstructions] = useState('');
  const [refining, setRefining] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const refinementOptions = [
    { value: 'improve', label: 'Improve', description: 'Make content more engaging and impactful' },
    { value: 'expand', label: 'Expand', description: 'Add more detail and depth' },
    { value: 'condense', label: 'Condense', description: 'Make it more concise' },
    { value: 'simplify', label: 'Simplify', description: 'Use simpler language' },
    { value: 'formalize', label: 'Formalize', description: 'Make it more professional' }
  ];

  const handleRefine = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Please enter content to refine');
      return;
    }

    setError('');
    setRefining(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/refine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            content,
            refinementType,
            tone,
            targetLength: targetLength ? parseInt(targetLength) : null,
            instructions
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to refine content');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Error refining content: ' + err.message);
    } finally {
      setRefining(false);
    }
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
                Refine Content
              </h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                Improve, expand, or modify existing content
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Panel - Form */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: 'fit-content'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
              Refinement Options
            </h2>

            <form onSubmit={handleRefine}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '12px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                  Refinement Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {refinementOptions.map(option => (
                    <label
                      key={option.value}
                      style={{
                        padding: '12px',
                        border: refinementType === option.value ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: refinementType === option.value ? '#eff6ff' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="radio"
                        name="refinementType"
                        value={option.value}
                        checked={refinementType === option.value}
                        onChange={(e) => setRefinementType(e.target.value)}
                        style={{ marginRight: '8px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>{option.label}</span>
                      <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {option.description}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Target Length (words, optional)
                </label>
                <input
                  type="number"
                  value={targetLength}
                  onChange={(e) => setTargetLength(e.target.value)}
                  placeholder="e.g., 1500"
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
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Any specific instructions for refinement"
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
                disabled={refining}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: refining ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: refining ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {refining ? '⏳ Refining...' : '✨ Refine Content'}
              </button>
            </form>
          </div>

          {/* Right Panel - Input & Output */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Input */}
            <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                Original Content
              </h3>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your content here..."
                rows="10"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  lineHeight: '1.5'
                }}
              />
            </div>

            {/* Output */}
            {result && (
              <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                  Refined Content
                </h3>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#374151',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {result.content}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    onClick={() => {
                      setContent(result.content);
                      setResult(null);
                    }}
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
                    ✓ Use This Version
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
