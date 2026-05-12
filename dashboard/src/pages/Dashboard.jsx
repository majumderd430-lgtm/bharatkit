import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart } from '../components/UsageChart.jsx';

const api = axios.create({ baseURL: '/api/v1' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Dashboard() {
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/billing/usage'),
      api.get('/billing/usage/history?limit=10'),
      api.get('/auth/me'),
    ]).then(([usageRes, historyRes, meRes]) => {
      setUsage(usageRes.data.data);
      setHistory(historyRes.data.data);
      setDeveloper(meRes.data.data.developer);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Generate last 30 days labels
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  });

  // Mock daily data (in production, fetch from API)
  const dailyData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 50));

  const successRate = history.length > 0
    ? Math.round((history.filter((h) => h.responseStatus < 400).length / history.length) * 100)
    : 100;

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#94a3b8' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title">
          Welcome back, {developer?.companyName || 'Developer'} 👋
        </h1>
        <p className="page-subtitle">Here's your API usage overview for this month.</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-label">Total API Calls</div>
          <div className="stat-value" style={{ color: '#6366f1' }}>
            {(usage?.totalCalls || 0).toLocaleString()}
          </div>
          <div className="stat-sub">This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cost</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            ₹{(usage?.totalCost || 0).toFixed(2)}
          </div>
          <div className="stat-sub">This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Success Rate</div>
          <div className="stat-value" style={{ color: successRate > 95 ? '#10b981' : '#f59e0b' }}>
            {successRate}%
          </div>
          <div className="stat-sub">Last 10 calls</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Services Used</div>
          <div className="stat-value" style={{ color: '#f97316' }}>
            {Object.values(usage?.breakdown || {}).filter((s) => s.calls > 0).length}
          </div>
          <div className="stat-sub">of 5 available</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
          API Calls — Last 30 Days
        </h3>
        <LineChart labels={last30Days} data={dailyData} label="API Calls" />
      </div>

      {/* Service Breakdown */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Service Breakdown</h3>
          {Object.entries(usage?.breakdown || {}).map(([service, data]) => (
            <div key={service} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid #334155',
            }}>
              <div>
                <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{service}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{data.calls} calls</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', color: '#10b981' }}>₹{data.cost.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Calls */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Recent API Calls</h3>
          {history.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>No API calls yet. Start by making your first request.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((call) => (
                    <tr key={call.id}>
                      <td style={{ fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {call.endpoint}
                      </td>
                      <td>
                        <span className={`badge ${call.responseStatus < 400 ? 'badge-success' : 'badge-danger'}`}>
                          {call.responseStatus}
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '13px' }}>{call.responseTime}ms</td>
                      <td style={{ color: '#10b981', fontSize: '13px' }}>₹{call.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
