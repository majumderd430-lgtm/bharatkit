import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ApiKeys from './pages/ApiKeys.jsx';
import Usage from './pages/Usage.jsx';
import Billing from './pages/Billing.jsx';
import Docs from './pages/Docs.jsx';
import Navbar from './components/Navbar.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const styles = `
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-card: #1e293b;
    --border: #334155;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --accent: #6366f1;
    --accent-hover: #4f46e5;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --orange: #f97316;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg-primary); color: var(--text-primary); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  a { color: var(--accent); text-decoration: none; }
  button { cursor: pointer; border: none; outline: none; }
  input, select, textarea { outline: none; }
  .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.2s; }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: var(--accent-hover); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); }
  .btn-secondary:hover { border-color: var(--accent); }
  .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-danger { background: var(--danger); color: white; }
  .input { width: 100%; padding: 10px 14px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 14px; transition: border-color 0.2s; }
  .input:focus { border-color: var(--accent); }
  .label { display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; }
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .badge-success { background: rgba(16,185,129,0.15); color: var(--success); }
  .badge-warning { background: rgba(245,158,11,0.15); color: var(--warning); }
  .badge-danger { background: rgba(239,68,68,0.15); color: var(--danger); }
  .badge-info { background: rgba(99,102,241,0.15); color: var(--accent); }
  .page { padding: 32px 0; min-height: calc(100vh - 64px); }
  .page-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
  .page-subtitle { color: var(--text-secondary); font-size: 14px; margin-bottom: 32px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
  .stat-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
  .stat-value { font-size: 32px; font-weight: 700; }
  .stat-sub { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
  td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid rgba(51,65,85,0.5); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,0.02); }
  .code { font-family: 'Courier New', monospace; background: var(--bg-primary); padding: 2px 8px; border-radius: 4px; font-size: 13px; }
  @media (max-width: 768px) {
    .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    .container { padding: 0 16px; }
  }
`;

function PrivateRoute({ children }) {
  const token = localStorage.getItem('bk_token');
  return token ? children : <Navigate to="/dashboard/login" replace />;
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <div className="container">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </>
  );
}

export default function App() {
  return (
    <>
      <style>{styles}</style>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/dashboard/login" element={<Login />} />
          <Route path="/dashboard/register" element={<Register />} />
          <Route path="/dashboard/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/dashboard/keys" element={<PrivateRoute><Layout><ApiKeys /></Layout></PrivateRoute>} />
          <Route path="/dashboard/usage" element={<PrivateRoute><Layout><Usage /></Layout></PrivateRoute>} />
          <Route path="/dashboard/billing" element={<PrivateRoute><Layout><Billing /></Layout></PrivateRoute>} />
          <Route path="/dashboard/docs" element={<PrivateRoute><Layout><Docs /></Layout></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
