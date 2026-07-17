'use client';

import { useState } from 'react';

export default function SegmentFilter({
  segments = { deviceType: [], trafficSource: [], country: [] },
  onFilter = () => {},
  loading = false
}) {
  const [selectedSegments, setSelectedSegments] = useState({
    deviceType: [],
    trafficSource: [],
    country: []
  });

  const handleSegmentChange = (type, value) => {
    setSelectedSegments(prev => {
      const updated = { ...prev };
      if (updated[type].includes(value)) {
        updated[type] = updated[type].filter(v => v !== value);
      } else {
        updated[type] = [...updated[type], value];
      }
      onFilter(updated);
      return updated;
    });
  };

  const handleClear = () => {
    setSelectedSegments({
      deviceType: [],
      trafficSource: [],
      country: []
    });
    onFilter({
      deviceType: [],
      trafficSource: [],
      country: []
    });
  };

  const deviceTypes = ['desktop', 'mobile', 'tablet'];
  const trafficSources = ['organic', 'direct', 'referral', 'social', 'email', 'paid'];
  const countries = segments.country || [];

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1f2937' }}>🔍 Filter by Segments</h3>
        <button
          onClick={handleClear}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            color: '#6b7280',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear All
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {/* Device Type */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '13px', fontWeight: '600' }}>
            Device Type
          </h4>
          {deviceTypes.map(device => (
            <label key={device} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedSegments.deviceType.includes(device)}
                onChange={() => handleSegmentChange('deviceType', device)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: '#374151', textTransform: 'capitalize' }}>{device}</span>
            </label>
          ))}
        </div>

        {/* Traffic Source */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '13px', fontWeight: '600' }}>
            Traffic Source
          </h4>
          {trafficSources.map(source => (
            <label key={source} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedSegments.trafficSource.includes(source)}
                onChange={() => handleSegmentChange('trafficSource', source)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: '#374151', textTransform: 'capitalize' }}>{source}</span>
            </label>
          ))}
        </div>

        {/* Countries */}
        {countries.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '13px', fontWeight: '600' }}>
              Top Countries
            </h4>
            {countries.slice(0, 5).map(country => (
              <label key={country} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedSegments.country.includes(country)}
                  onChange={() => handleSegmentChange('country', country)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: '#374151' }}>{country}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {(selectedSegments.deviceType.length > 0 ||
        selectedSegments.trafficSource.length > 0 ||
        selectedSegments.country.length > 0) && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
            Active Filters:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[...selectedSegments.deviceType, ...selectedSegments.trafficSource, ...selectedSegments.country].map((filter, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                {filter}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
