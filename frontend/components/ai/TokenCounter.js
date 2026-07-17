export default function TokenCounter({ content = '', model = 'gpt-3.5-turbo' }) {
  // Rough estimation: ~1 token per 4 characters, plus 10% overhead
  const estimatedTokens = Math.ceil((content.length / 4) * 1.1);

  const models = {
    'gpt-3.5-turbo': { inputRate: 0.0005, outputRate: 0.0015 },
    'gpt-4': { inputRate: 0.03, outputRate: 0.06 },
    'gpt-4-turbo': { inputRate: 0.01, outputRate: 0.03 }
  };

  const rate = models[model] || models['gpt-3.5-turbo'];
  const estimatedCost = ((estimatedTokens / 1000) * (rate.inputRate + rate.outputRate)).toFixed(4);

  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>
          Estimated Tokens
        </div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
          {estimatedTokens.toLocaleString()}
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
            Character Count
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            {content.length.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
            Est. Cost
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
            ${estimatedCost}
          </div>
        </div>
      </div>
    </div>
  );
}
