export default function GenerationStatus({ status = 'pending', actionTaken = null }) {
  const statusConfig = {
    pending: {
      bg: '#fef3c7',
      text: '#92400e',
      icon: '⏳',
      label: 'Pending'
    },
    generating: {
      bg: '#dbeafe',
      text: '#0c4a6e',
      icon: '⚙️',
      label: 'Generating'
    },
    completed: {
      bg: '#dcfce7',
      text: '#15803d',
      icon: '✓',
      label: 'Completed'
    },
    failed: {
      bg: '#fee2e2',
      text: '#991b1b',
      icon: '✕',
      label: 'Failed'
    }
  };

  const actionConfig = {
    saved_to_draft: {
      bg: '#d1fae5',
      text: '#065f46',
      label: 'Saved to Draft'
    },
    saved_to_blog: {
      bg: '#cffafe',
      text: '#0e7490',
      label: 'Saved to Blog'
    },
    discarded: {
      bg: '#fee2e2',
      text: '#991b1b',
      label: 'Discarded'
    },
    regenerated: {
      bg: '#fef3c7',
      text: '#92400e',
      label: 'Regenerated'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const actionCfg = actionTaken ? actionConfig[actionTaken] : null;

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: config.bg,
        color: config.text,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        <span style={{ fontSize: '14px' }}>{config.icon}</span>
        {config.label}
      </div>

      {actionCfg && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: actionCfg.bg,
          color: actionCfg.text,
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {actionCfg.label}
        </div>
      )}
    </div>
  );
}
