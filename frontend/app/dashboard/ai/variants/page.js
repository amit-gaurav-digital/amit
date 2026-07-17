'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AIVariantsPage() {
  const [content, setContent] = useState('');
  const [variantTypes, setVariantTypes] = useState(['tone_variation']);
  const [tones, setTones] = useState(['casual']);
  const [count, setCount] = useState(3);
  const [preserveKeywords, setPreserveKeywords] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState([]);
  const [error, setError] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);

  const variantTypeOptions = [
    { value: 'tone_variation', label: 'Tone Variations', icon: '🎨' },
    { value: 'length_variation', label: 'Length Variations', icon: '📏' },
    { value: 'seo_variant', label: 'SEO Optimized', icon: '🔍' },
    { value: 'audience_variant', label: 'Audience Targeted', icon: '👥' }
  ];

  const handleGenerateVariants = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Please enter content');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/generate/variants`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            content,
            variantTypes,
            tones: tones.length > 0 ? tones : null,
            count,
            preserveKeywords
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate variants');
        return;
      }

      setVariants(data.variants || []);
      setSelectedVariant(0);
    } catch (err) {
      setError('Error generating variants: ' + err.message);
    } finally {
      setGenerating(false);
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
                Content Variants Generator
              </h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                Create multiple versions for A/B testing
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
          {/* Sidebar - Form */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: 'fit-content'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
              Settings
            </h2>

            <form onSubmit={handleGenerateVariants}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                  Variant Types
                </label>
                {variantTypeOptions.map(type => (
                  <label key={type.value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    marginBottom: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={variantTypes.includes(type.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setVariantTypes([...variantTypes, type.value]);
                        } else {
                          setVariantTypes(variantTypes.filter(t => t !== type.value));
                        }
                      }}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px' }}>{type.icon} {type.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Number of Variants
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(Math.min(10, Math.max(2, parseInt(e.target.value) || 2)))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={preserveKeywords}
                    onChange={(e) => setPreserveKeywords(e.target.checked)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                    Preserve Keywords
                  </span>
                </label>
                <p style={{ margin: '8px 0 0 24px', fontSize: '12px', color: '#6b7280' }}>
                  Keep original keywords in all variants
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '13px'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={generating || variantTypes.length === 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: generating || variantTypes.length === 0 ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: generating || variantTypes.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {generating ? '⏳ Generating...' : '✨ Generate Variants'}
              </button>
            </form>
          </div>

          {/* Main Content Area */}
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
                rows="8"
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

            {/* Variants Display */}
            {variants.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                  Generated Variants ({variants.length})
                </h3>

                {/* Variant Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '20px',
                  overflowX: 'auto',
                  paddingBottom: '10px'
                }}>
                  {variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(idx)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: selectedVariant === idx ? '#3b82f6' : '#f3f4f6',
                        color: selectedVariant === idx ? 'white' : '#1f2937',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Variant {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Variant Content */}
                {selectedVariant !== null && variants[selectedVariant] && (
                  <div>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      marginBottom: '15px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#374151',
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
                      {variants[selectedVariant].content}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          setContent(variants[selectedVariant].content);
                          setVariants([]);
                          setSelectedVariant(null);
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
                        ✓ Use This Variant
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
