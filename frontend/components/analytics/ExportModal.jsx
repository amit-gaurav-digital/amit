'use client';

import { useState } from 'react';

export default function ExportModal({
  isOpen = false,
  onClose = () => {},
  onExport = () => {},
  blogId,
  formats = ['csv', 'json', 'pdf']
}) {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [includeMetrics, setIncludeMetrics] = useState({
    views: true,
    visitors: true,
    engagement: true,
    bounceRate: true,
    performance: true
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport({
        format: selectedFormat,
        metrics: Object.keys(includeMetrics).filter(k => includeMetrics[k]),
        blogId
      });
      onClose();
    } catch (error) {
      alert('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
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
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
        padding: '30px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>📥 Export Analytics</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
            Format
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {formats.map(format => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid ' + (selectedFormat === format ? '#3b82f6' : '#d1d5db'),
                  backgroundColor: selectedFormat === format ? '#dbeafe' : 'white',
                  color: selectedFormat === format ? '#1e40af' : '#374151',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}
              >
                {format}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
            Metrics to Include
          </label>
          {Object.entries(includeMetrics).map(([key, value]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setIncludeMetrics({ ...includeMetrics, [key]: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: '#374151', textTransform: 'capitalize' }}>{key}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={exporting}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              borderRadius: '6px',
              cursor: exporting ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              opacity: exporting ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: exporting ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              opacity: exporting ? 0.5 : 1
            }}
          >
            {exporting ? '⏳ Exporting...' : '✓ Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
