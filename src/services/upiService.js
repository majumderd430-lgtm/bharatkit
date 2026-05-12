const { v4: uuidv4 } = require('uuid');

// Sandbox transaction store (in-memory)
const sandboxTransactions = new Map();

/**
 * Verify UPI ID
 */
async function verifyUpiId(upiId, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 300));

    // Sandbox: test@sandbox always valid
    if (upiId === 'test@sandbox' || upiId.endsWith('@sandbox')) {
      return { valid: true, name: 'Test User', bank: 'Sandbox Bank' };
    }

    // Simulate some invalid IDs
    if (upiId.includes('invalid')) {
      return { valid: false, name: null, bank: null };
    }

    return {
      valid: true,
      name: 'Sample User',
      bank: upiId.split('@')[1].toUpperCase() + ' Bank',
    };
  }

  // Production: call real UPI verification API
  const response = await fetch(`${process.env.UPI_API_URL}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.UPI_API_KEY}`,
    },
    body: JSON.stringify({ upiId }),
  });

  if (!response.ok) {
    const err = new Error('UPI verification service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Send UPI payment
 */
async function sendUpiPayment(toUpiId, amount, note, merchantOrderId, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 600));

    const transactionId = `TXN_SANDBOX_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
    const upiRefId = `UPI${Date.now()}`;

    const txn = {
      success: true,
      transactionId,
      upiRefId,
      status: 'SUCCESS',
      toUpiId,
      amount,
      note,
      merchantOrderId,
      timestamp: new Date().toISOString(),
    };

    sandboxTransactions.set(transactionId, txn);
    return txn;
  }

  // Production: call real UPI payment API
  const response = await fetch(`${process.env.UPI_API_URL}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.UPI_API_KEY}`,
    },
    body: JSON.stringify({ toUpiId, amount, note, merchantOrderId }),
  });

  if (!response.ok) {
    const err = new Error('UPI payment service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Get UPI transaction status
 */
async function getTransactionStatus(transactionId, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 200));

    const txn = sandboxTransactions.get(transactionId);
    if (!txn) {
      return {
        transactionId,
        status: 'NOT_FOUND',
        amount: null,
        timestamp: null,
        failureReason: 'Transaction not found in sandbox',
      };
    }

    return {
      transactionId: txn.transactionId,
      status: txn.status,
      amount: txn.amount,
      timestamp: txn.timestamp,
      failureReason: null,
    };
  }

  // Production
  const response = await fetch(`${process.env.UPI_API_URL}/status/${transactionId}`, {
    headers: { 'Authorization': `Bearer ${process.env.UPI_API_KEY}` },
  });

  if (!response.ok) {
    const err = new Error('UPI status service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Initiate UPI refund
 */
async function initiateRefund(transactionId, amount, reason, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 400));

    const refundId = `REFUND_SANDBOX_${uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase()}`;
    return {
      refundId,
      status: 'INITIATED',
      transactionId,
      amount,
      reason,
      estimatedTime: '2-3 business days',
      initiatedAt: new Date().toISOString(),
    };
  }

  // Production
  const response = await fetch(`${process.env.UPI_API_URL}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.UPI_API_KEY}`,
    },
    body: JSON.stringify({ transactionId, amount, reason }),
  });

  if (!response.ok) {
    const err = new Error('UPI refund service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

module.exports = { verifyUpiId, sendUpiPayment, getTransactionStatus, initiateRefund };
