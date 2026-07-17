export default function GenerationPreview({ data, onSave, onDiscard, loading = false }) {
  if (!data) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#9ca3af'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>📄</div>
        <p style={{ margin: 0, fontSize: '14px' }}>
          No content generated yet
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title and Excerpt */}
      <div>
        <h3 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
          {data.title || 'Untitled'}
        </h3>
        {data.excerpt && (
          <p style={{
            margin: '0 0 10px 0',
            color: '#6b7280',
            fontSize: '13px',
            lineHeight: '1.5',
            fontStyle: 'italic'
          }}>
            {data.excerpt}
          </p>
        )}
      </div>

      {/* Metrics */}
      {data.metrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '10px',
          padding: '15px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>
              SEO Score
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>
              {data.metrics.seoScore || 0}/100
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>
              Readability
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>
              {data.metrics.readabilityScore || 0}/100
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>
              Word Count
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b' }}>
              {(data.metrics.wordCount || 0).toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>
              Read Time
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#8b5cf6' }}>
              {data.metrics.estimatedReadTime || 0} min
            </div>
          </div>
        </div>
      )}

      {/* Content Preview */}
      {data.content && (
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '15px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#374151'
        }}>
          {data.content}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onDiscard}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: loading ? '#f3f4f6' : '#ef4444',
            color: loading ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          ✕ Discard
        </button>
        <button
          onClick={onSave}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: loading ? '#d1d5db' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {loading ? '⏳ Saving...' : '✓ Save'}
        </button>
      </div>
    </div>
  );
}
