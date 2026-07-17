export default function VariantComparison({ variants = [], onSelectVariant }) {
  if (!variants || variants.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#9ca3af'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔄</div>
        <p style={{ margin: 0, fontSize: '14px' }}>
          No variants to compare
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(variants.length, 4)}, 1fr)`,
        gap: '15px',
        marginBottom: '20px'
      }}>
        {variants.map((variant, idx) => (
          <div
            key={idx}
            onClick={() => onSelectVariant?.(idx)}
            style={{
              padding: '15px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: 'white',
              transition: 'all 0.2s',
              ':hover': {
                borderColor: '#3b82f6',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '10px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Variant {idx + 1}
              </div>
              {variant.variantType && (
                <span style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  backgroundColor: '#e0e7ff',
                  color: '#3b82f6',
                  borderRadius: '4px',
                  fontWeight: '600'
                }}>
                  {variant.variantType.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {variant.metrics && (
              <div style={{
                display: 'flex',
                gap: '8px',
                fontSize: '12px'
              }}>
                {variant.metrics.seoScore !== undefined && (
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: '2px' }}>SEO</div>
                    <div style={{ fontWeight: '600', color: '#10b981' }}>
                      {variant.metrics.seoScore}
                    </div>
                  </div>
                )}
                {variant.metrics.readabilityScore !== undefined && (
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: '2px' }}>Read</div>
                    <div style={{ fontWeight: '600', color: '#3b82f6' }}>
                      {variant.metrics.readabilityScore}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
