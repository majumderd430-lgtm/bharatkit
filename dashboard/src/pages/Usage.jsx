import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart } from '../components/UsageChart.jsx';

const api = axios.create({ baseURL: '/api/v1' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Usage() {
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      api.get('/billing/usage'),
      api.get(`/billing/usage/history?page=${page}&limit=20`),
    ]).then(([usageRes, historyRes]) => {
      setUsage(usageRes.data.data);
      setHistory(historyRes.data.data);
      setPagination(historyRes.data.pagination);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page]);

  const services = usage ? Object.keys(usage.breakdown) : [];
  const barData = services.map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    data: [usage.breakdown[s].calls],
  }));

  return (
    <div className="page">
      <h1 className="page-title">Usage Analytics</h1>
      <p className="page-subtitle">Detailed breakdown of your API usage and costs.</p>

      {/* Service breakdown chart */}
      {usage && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Calls by Service</h3>
          <BarChart
            labels={['This Month']}
            datasets={barData}
          />
        </div>
      )}

      {/* Service cards */}
      {usage && (
        <div className="grid-3" style={{ marginBottom: '32px' }}>
          {Object.entries(usage.breakdown).map(([service, data]) => (
            <div key={service} className="stat-card">
              <div className="stat-label" style={{ textTransform: 'capitalize' }}>{service} API</div>
              <div className="stat-value" style={{ fontSize: '24px', color: '#6366f1' }}>
                {data.calls.toLocaleString()}
              </div>
              <div className="stat-sub">calls • ₹{data.cost.toFixed(2)} cost</div>
            </div>
          ))}
        </div>
      )}

      {/* History table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
            API Call History
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '400', marginLeft: '8px' }}>
              ({pagination.total} total)
            </span>
          </h3>
        </div>

        {loading ? (
          <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : history.length === 0 ? (
          <div style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>
            No API calls yet. Make your first request to see it here.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Endpoint</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Cost</th>
                    <th>Env</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((call) => (
                    <tr key={call.id}>
                      <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(call.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <code style={{ fontSize: '11px' }}>{call.endpoint}</code>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                          {call.service}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${call.responseStatus < 400 ? 'badge-success' : 'badge-danger'}`}>
                          {call.responseStatus}
                        </span>
                      </td>
                      <td style={{ color: call.responseTime > 1000 ? '#f59e0b' : '#94a3b8', fontSize: '13px' }}>
                        {call.responseTime}ms
                      </td>
                      <td style={{ color: '#10b981', fontSize: '13px', fontWeight: '500' }}>
                        ₹{call.cost.toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${call.environment === 'production' ? 'badge-warning' : 'badge-info'}`}>
                          {call.environment === 'production' ? 'Live' : 'Sandbox'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ fontSize: '13px', padding: '6px 14px' }}
              >
                ← Previous
              </button>
              <span style={{ padding: '8px 16px', color: '#94a3b8', fontSize: '13px' }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                style={{ fontSize: '13px', padding: '6px 14px' }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
