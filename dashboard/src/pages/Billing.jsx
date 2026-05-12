import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Billing() {
  const [usage, setUsage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/billing/usage'),
      api.get('/billing/invoices'),
    ]).then(([usageRes, invoicesRes]) => {
      setUsage(usageRes.data.data);
      setInvoices(invoicesRes.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await api.post('/billing/pay');
      const { orderId, amount } = res.data.data;

      // Load Razorpay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: Math.round(amount * 100),
          currency: 'INR',
          name: 'BharatKit',
          description: `API Usage Bill - ${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`,
          order_id: orderId,
          handler: (response) => {
            setMessage('Payment successful! Your bill has been marked as paid.');
          },
          theme: { color: '#6366f1' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
    } catch (err) {
      setMessage('Failed to initiate payment: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setPaying(false);
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="page">
      <h1 className="page-title">Billing</h1>
      <p className="page-subtitle">Manage your billing and view invoice history.</p>

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

      {/* Current Bill */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
              Current Month Bill
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
              {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span className="badge badge-warning">Pending</span>
        </div>

        <div style={{ margin: '24px 0', padding: '24px', background: '#0f172a', borderRadius: '10px' }}>
          <div style={{ fontSize: '48px', fontWeight: '700', color: '#10b981' }}>
            ₹{(usage?.totalCost || 0).toFixed(2)}
          </div>
          <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            {usage?.totalCalls || 0} API calls this month
          </div>
        </div>

        {/* Breakdown */}
        {usage && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', marginBottom: '12px' }}>
              BREAKDOWN
            </h4>
            {Object.entries(usage.breakdown).map(([service, data]) => (
              <div key={service} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #334155',
                fontSize: '14px',
              }}>
                <span style={{ textTransform: 'capitalize', color: '#e2e8f0' }}>{service} API</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#64748b', marginRight: '16px' }}>{data.calls} calls</span>
                  <span style={{ color: '#10b981', fontWeight: '500' }}>₹{data.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {(usage?.totalCost || 0) > 0 ? (
          <button
            onClick={handlePay}
            className="btn btn-primary"
            disabled={paying}
            style={{ padding: '12px 32px', fontSize: '15px' }}
          >
            {paying ? 'Processing...' : `Pay ₹${(usage?.totalCost || 0).toFixed(2)} Now`}
          </button>
        ) : (
          <div style={{ color: '#10b981', fontSize: '14px' }}>
            ✅ No outstanding balance. You're all caught up!
          </div>
        )}
      </div>

      {/* Invoice History */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Invoice History</h3>

        {loading ? (
          <div style={{ color: '#94a3b8', padding: '20px', textAlign: 'center' }}>Loading...</div>
        ) : invoices.length === 0 ? (
          <div style={{ color: '#64748b', padding: '20px', textAlign: 'center' }}>
            No invoices yet. Your first invoice will appear here at the end of the month.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Total Calls</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid On</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{months[invoice.month - 1]} {invoice.year}</td>
                  <td>{invoice.totalCalls.toLocaleString()}</td>
                  <td style={{ color: '#10b981', fontWeight: '500' }}>₹{invoice.totalCost.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${
                      invoice.status === 'paid' ? 'badge-success' :
                      invoice.status === 'failed' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '13px' }}>
                    {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
