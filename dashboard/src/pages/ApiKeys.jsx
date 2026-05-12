import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ApiKeyCard from '../components/ApiKeyCard.jsx';

const api = axios.create({ baseURL: '/api/v1' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [message, setMessage] = useState('');

  const fetchKeys = async () => {
    try {
      const res = await api.get('/auth/me');
      setKeys(res.data.data.apiKeys);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleRegenerate = async (keyId, environment) => {
    if (!confirm(`Regenerate this ${environment} key? The old key will stop working immediately.`)) return;

    setRegenerating(true);
    try {
      await api.post('/auth/regenerate-key', { keyId, environment });
      setMessage('Key regenerated successfully. Refreshing...');
      await fetchKeys();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to regenerate key: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">API Keys</h1>
      <p className="page-subtitle">Manage your sandbox and production API keys.</p>

      {message && (
        <div style={{
          background: message.includes('Failed') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${message.includes('Failed') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: message.includes('Failed') ? '#ef4444' : '#10b981',
          fontSize: '14px',
        }}>
          {message}
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px', background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.3)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#6366f1' }}>
          🔐 Security Best Practices
        </h3>
        <ul style={{ fontSize: '13px', color: '#94a3b8', paddingLeft: '16px', lineHeight: '1.8' }}>
          <li>Never expose your production key in client-side code or public repositories</li>
          <li>Use sandbox keys for development and testing — they're free and safe</li>
          <li>Rotate production keys periodically or if you suspect a compromise</li>
          <li>Set up IP allowlisting in production for extra security</li>
        </ul>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Loading API keys...</div>
      ) : (
        <>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#94a3b8' }}>
            🟢 Sandbox Keys
          </h3>
          {keys.filter((k) => k.environment === 'sandbox').map((key) => (
            <ApiKeyCard key={key.id} apiKey={key} onRegenerate={handleRegenerate} />
          ))}

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', marginTop: '32px', color: '#94a3b8' }}>
            🔴 Production Keys
          </h3>
          {keys.filter((k) => k.environment === 'production').map((key) => (
            <ApiKeyCard key={key.id} apiKey={key} onRegenerate={handleRegenerate} />
          ))}
        </>
      )}

      <div className="card" style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Using Your API Key</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
          Include your API key in the Authorization header of every request:
        </p>
        <pre style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '13px',
          color: '#e2e8f0',
          overflowX: 'auto',
        }}>
{`curl -X POST https://api.bharatkit.dev/api/v1/kyc/pan \\
  -H "Authorization: Bearer bk_sandbox_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"panNumber": "ABCDE1234F", "name": "Rahul Sharma", "dob": "1990-05-15"}'`}
        </pre>
      </div>
    </div>
  );
}
