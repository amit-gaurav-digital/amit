'use client';

import { useState } from 'react';

export default function DateRangePicker({
  onDateRangeChange,
  presets = ['7days', '30days', '90days', '365days']
}) {
  const [selectedPreset, setSelectedPreset] = useState('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const getPresetDates = (preset) => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case '90days':
        start.setDate(start.getDate() - 90);
        break;
      case '365days':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  };

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    setShowCustom(false);
    const { start, end } = getPresetDates(preset);
    onDateRangeChange?.(start, end);
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(customStart);
    const end = new Date(customEnd);

    if (start > end) {
      alert('Start date must be before end date');
      return;
    }

    onDateRangeChange?.(start, end);
  };

  const presetLabels = {
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    '90days': 'Last 90 Days',
    '365days': 'Last Year'
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>📅 Date Range</h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        {presets.map(preset => (
          <button
            key={preset}
            onClick={() => handlePresetChange(preset)}
            style={{
              padding: '8px 16px',
              border: '1px solid ' + (selectedPreset === preset ? '#3b82f6' : '#d1d5db'),
              backgroundColor: selectedPreset === preset ? '#3b82f6' : 'white',
              color: selectedPreset === preset ? 'white' : '#374151',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: selectedPreset === preset ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            {presetLabels[preset]}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          style={{
            padding: '8px 16px',
            border: '1px solid ' + (showCustom ? '#3b82f6' : '#d1d5db'),
            backgroundColor: showCustom ? '#3b82f6' : 'white',
            color: showCustom ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: showCustom ? '600' : '500',
            transition: 'all 0.2s'
          }}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#6b7280' }}>
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#6b7280' }}>
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>
          <button
            onClick={handleCustomApply}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
