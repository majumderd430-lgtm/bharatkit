import React, { useState } from 'react';

const endpoints = [
  {
    category: 'KYC API',
    color: '#6366f1',
    items: [
      {
        method: 'POST',
        path: '/api/v1/kyc/aadhaar/send-otp',
        description: 'Send OTP to Aadhaar-linked mobile number',
        cost: 'Free',
        request: `{
  "aadhaarNumber": "123456789012"
}`,
        response: `{
  "success": true,
  "data": {
    "otpSent": true,
    "maskedMobile": "XXXXXX7890",
    "txnId": "TXN_SANDBOX_1234567890"
  }
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/kyc/aadhaar',
        description: 'Verify Aadhaar with OTP',
        cost: '₹2 per call',
        request: `{
  "aadhaarNumber": "123456789012",
  "otp": "123456"
}`,
        response: `{
  "success": true,
  "data": {
    "verified": true,
    "name": "Rahul Sharma",
    "dob": "1990-05-15",
    "gender": "M",
    "address": { "city": "Bengaluru", "state": "Karnataka" }
  }
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/kyc/pan',
        description: 'Verify PAN card details',
        cost: '₹1 per call',
        request: `{
  "panNumber": "ABCDE1234F",
  "name": "Rahul Sharma",
  "dob": "1990-05-15"
}`,
        response: `{
  "success": true,
  "data": {
    "verified": true,
    "nameMatch": true,
    "dobMatch": true,
    "panStatus": "ACTIVE",
    "linkedToAadhaar": true
  }
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/kyc/face-match',
        description: 'Match selfie with Aadhaar photo',
        cost: '₹3 per call',
        request: `{
  "selfieBase64": "data:image/jpeg;base64,...",
  "aadhaarPhotoBase64": "data:image/jpeg;base64,..."
}`,
        response: `{
  "success": true,
  "data": {
    "matched": true,
    "confidenceScore": 95.7,
    "livenessDetected": true,
    "fraudRisk": "LOW"
  }
}`,
      },
    ],
  },
  {
    category: 'UPI Payments API',
    color: '#10b981',
    items: [
      {
        method: 'POST',
        path: '/api/v1/payments/upi/send',
        description: 'Send UPI payment',
        cost: '0.1% of amount',
        request: `{
  "toUpiId": "test@sandbox",
  "amount": 1000,
  "note": "Payment for services",
  "merchantOrderId": "ORDER_001"
}`,
        response: `{
  "success": true,
  "data": {
    "transactionId": "TXN_SANDBOX_ABC123",
    "upiRefId": "UPI1234567890",
    "status": "SUCCESS",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/payments/upi/verify-id',
        description: 'Verify if a UPI ID is valid',
        cost: '₹0.50 per call',
        request: `{
  "upiId": "test@sandbox"
}`,
        response: `{
  "success": true,
  "data": {
    "valid": true,
    "name": "Test User",
    "bank": "Sandbox Bank"
  }
}`,
      },
    ],
  },
  {
    category: 'Bank Statement API',
    color: '#f59e0b',
    items: [
      {
        method: 'POST',
        path: '/api/v1/bank/request-consent',
        description: 'Initiate Account Aggregator consent',
        cost: '₹2 per request',
        request: `{
  "userId": "user_123",
  "userMobile": "9876543210",
  "months": 6
}`,
        response: `{
  "success": true,
  "data": {
    "consentId": "CONSENT_SANDBOX_ABC123",
    "consentUrl": "https://sandbox.bharatkit.dev/consent/...",
    "status": "PENDING"
  }
}`,
      },
    ],
  },
  {
    category: 'GST Business API',
    color: '#f97316',
    items: [
      {
        method: 'POST',
        path: '/api/v1/business/verify-gst',
        description: 'Verify GSTIN and get business details',
        cost: '₹1 per call',
        request: `{
  "gstin": "27AAPFU0939F1ZV"
}`,
        response: `{
  "success": true,
  "data": {
    "verified": true,
    "legalName": "TECH SOLUTIONS PVT LTD",
    "gstStatus": "active",
    "filingStatus": "regular"
  }
}`,
      },
    ],
  },
];

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative' }}>
      <pre style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '12px',
        color: '#e2e8f0',
        overflowX: 'auto',
        lineHeight: '1.6',
      }}>
        {code}
      </pre>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#334155',
          color: '#94a3b8',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '11px',
          cursor: 'pointer',
        }}
      >
        {copied ? '✅' : '📋'}
      </button>
    </div>
  );
}

export default function Docs() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeEndpoint, setActiveEndpoint] = useState(0);

  const category = endpoints[activeCategory];
  const endpoint = category?.items[activeEndpoint];

  return (
    <div className="page">
      <h1 className="page-title">API Documentation</h1>
      <p className="page-subtitle">Complete reference for all BharatKit API endpoints.</p>

      {/* Quick start */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Quick Start</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
          All API requests require an API key in the Authorization header:
        </p>
        <CodeBlock code={`curl -X POST https://api.bharatkit.dev/api/v1/kyc/pan \\
  -H "Authorization: Bearer bk_sandbox_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"panNumber": "ABCDE1234F", "name": "Rahul Sharma", "dob": "1990-05-15"}'`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
        {/* Sidebar */}
        <div>
          {endpoints.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                color: cat.color,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px',
                padding: '0 8px',
              }}>
                {cat.category}
              </div>
              {cat.items.map((item, ii) => (
                <button
                  key={ii}
                  onClick={() => { setActiveCategory(ci); setActiveEndpoint(ii); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: activeCategory === ci && activeEndpoint === ii ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: activeCategory === ci && activeEndpoint === ii ? '#f1f5f9' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '2px',
                  }}
                >
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: item.method === 'GET' ? '#10b981' : '#6366f1',
                    marginRight: '6px',
                  }}>
                    {item.method}
                  </span>
                  {item.path.split('/').pop()}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Content */}
        {endpoint && (
          <div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{
                  background: endpoint.method === 'GET' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                  color: endpoint.method === 'GET' ? '#10b981' : '#6366f1',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '700',
                }}>
                  {endpoint.method}
                </span>
                <code style={{ fontSize: '14px', color: '#e2e8f0' }}>{endpoint.path}</code>
                <span className="badge badge-success" style={{ marginLeft: 'auto' }}>{endpoint.cost}</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>{endpoint.description}</p>
            </div>

            <div className="grid-2">
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Request Body
                </h4>
                <CodeBlock code={endpoint.request} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Response
                </h4>
                <CodeBlock code={endpoint.response} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
