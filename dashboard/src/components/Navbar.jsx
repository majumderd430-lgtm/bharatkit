import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('bk_token');

  const handleLogout = () => {
    localStorage.removeItem('bk_token');
    navigate('/dashboard/login');
  };

  if (!token) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: '#1e293b',
      borderBottom: '1px solid #334155',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/dashboard" style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#f1f5f9',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ color: '#6366f1' }}>⚡</span> BharatKit
        </Link>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/dashboard/keys', label: 'API Keys' },
            { path: '/dashboard/usage', label: 'Usage' },
            { path: '/dashboard/billing', label: 'Billing' },
            { path: '/dashboard/docs', label: 'Docs' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: isActive(item.path) ? '#f1f5f9' : '#94a3b8',
                background: isActive(item.path) ? 'rgba(99,102,241,0.15)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '13px' }}>
        Logout
      </button>
    </nav>
  );
}
