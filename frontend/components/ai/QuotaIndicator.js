export default function QuotaIndicator({ quota, type = 'tokens' }) {
  if (!quota) return null;

  const data = type === 'tokens'
    ? {
        used: quota.usage?.tokensUsed || 0,
        limit: quota.quota?.tokenQuota || 100000,
        label: 'Tokens'
      }
    : type === 'generations'
      ? {
          used: quota.usage?.generationsUsed || 0,
          limit: quota.quota?.generationQuota || 100,
          label: 'Generations'
        }
      : {
          used: quota.usage?.costUsd || 0,
          limit: quota.quota?.costLimit || 500,
          label: 'Cost (USD)'
        };

  const percentage = Math.round((data.used / data.limit) * 100);
  const color = percentage > 80 ? '#ef4444' : percentage > 60 ? '#f59e0b' : '#10b981';

  return (
    <div style={{
      padding: '15px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600' }}>
          {data.label}
        </span>
        <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600' }}>
          {percentage}%
        </span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, percentage)}%`,
          backgroundColor: color
        }}></div>
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
        {type === 'cost'
          ? `$${data.used.toFixed(2)} / $${data.limit.toFixed(2)}`
          : `${data.used.toLocaleString()} / ${data.limit.toLocaleString()}`
        }
      </div>
    </div>
  );
}
