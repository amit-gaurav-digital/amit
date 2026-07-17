export default function ToneSelector({ value, onChange, disabled = false }) {
  const tones = [
    { value: 'professional', label: 'Professional', icon: '💼', description: 'Formal and authoritative' },
    { value: 'casual', label: 'Casual', icon: '😊', description: 'Friendly and relaxed' },
    { value: 'academic', label: 'Academic', icon: '🎓', description: 'Research-focused' },
    { value: 'conversational', label: 'Conversational', icon: '💬', description: 'Personal and engaging' },
    { value: 'formal', label: 'Formal', icon: '🎩', description: 'Official and rigid' }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '10px'
    }}>
      {tones.map(tone => (
        <button
          key={tone.value}
          onClick={() => onChange(tone.value)}
          disabled={disabled}
          style={{
            padding: '15px',
            border: value === tone.value ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: value === tone.value ? '#eff6ff' : 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            {tone.icon}
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
            {tone.label}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            {tone.description}
          </div>
        </button>
      ))}
    </div>
  );
}
