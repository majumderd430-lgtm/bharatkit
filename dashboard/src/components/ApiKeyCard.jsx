import React, { useState } from 'react';

export default function ApiKeyCard({ apiKey, onRegenerate }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = apiKey.key.substring(0, 12) + '•'.repeat(20) + apiKey.key.slice(-4);

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600', fontSize: '15px' }}>{apiKey.name}</span>
            <span className={`badge ${apiKey.environment === 'production' ? 'badge-warning' : 'badge-info'}`}>
              {apiKey.environment === 'production' ? '🔴 Production' : '🟢 Sandbox'}
            </span>
            {!apiKey.isActive && <span className="badge badge-danger">Inactive</span>}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Created: {new Date(apiKey.createdAt).toLocaleDateString()} •
            Last used: {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Never'}
          </div>
        </div>
        <button
          onClick={() => onRegenerate(apiKey.id, apiKey.environment)}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          🔄 Regenerate
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '12px 16px',
      }}>
        <code style={{
          flex: 1,
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#e2e8f0',
          wordBreak: 'break-all',
        }}>
          {visible ? apiKey.key : maskedKey}
        </code>
        <button
          onClick={() => setVisible(!visible)}
          style={{ background: 'none', color: '#94a3b8', fontSize: '16px', padding: '4px' }}
          title={visible ? 'Hide key' : 'Show key'}
        >
          {visible ? '🙈' : '👁️'}
        </button>
        <button
          onClick={handleCopy}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px', whiteSpace: 'nowrap' }}
        >
          {copied ? '✅ Copied' : '📋 Copy'}
        </button>
      </div>
    </div>
  );
}
