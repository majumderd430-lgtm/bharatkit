import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/v1/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0f172a', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>BharatKit</h1>
        </div>

        <div className="card">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Check your email</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                If an account with <strong>{email}</strong> exists, we've sent a password reset link. Check your inbox (and spam folder).
              </p>
              <Link to="/dashboard/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Forgot your password?</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
                  color: '#ef4444', fontSize: '14px',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Email address</label>
                  <input
                    type="email" className="input" placeholder="you@company.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                  />
                </div>
                <button
                  type="submit" className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#94a3b8' }}>
                <Link to="/dashboard/login" style={{ color: '#6366f1' }}>← Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
