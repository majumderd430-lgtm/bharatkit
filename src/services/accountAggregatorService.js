const { v4: uuidv4 } = require('uuid');

// Sandbox consent store
const sandboxConsents = new Map();

/**
 * Request bank statement consent
 */
async function requestConsent(userId, userMobile, months, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 400));

    const consentId = `CONSENT_SANDBOX_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    sandboxConsents.set(consentId, {
      consentId,
      userId,
      userMobile,
      months,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return {
      consentId,
      consentUrl: `https://sandbox.bharatkit.dev/consent/${consentId}`,
      expiresAt: expiresAt.toISOString(),
      status: 'PENDING',
    };
  }

  // Production: call real Account Aggregator API
  const response = await fetch(`${process.env.ACCOUNT_AGGREGATOR_URL}/consent/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ACCOUNT_AGGREGATOR_KEY}`,
    },
    body: JSON.stringify({ userId, userMobile, months }),
  });

  if (!response.ok) {
    const err = new Error('Account Aggregator service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Check consent status
 */
async function getConsentStatus(consentId, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 200));

    const consent = sandboxConsents.get(consentId);
    if (!consent) {
      const err = new Error('Consent ID not found');
      err.code = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    // Auto-approve sandbox consents after 5 seconds
    const createdAt = new Date(consent.createdAt);
    const now = new Date();
    if (now - createdAt > 5000 && consent.status === 'PENDING') {
      consent.status = 'APPROVED';
      consent.approvedAt = new Date().toISOString();
      sandboxConsents.set(consentId, consent);
    }

    return {
      consentId: consent.consentId,
      status: consent.status,
      approvedAt: consent.approvedAt || null,
    };
  }

  // Production
  const response = await fetch(`${process.env.ACCOUNT_AGGREGATOR_URL}/consent/${consentId}`, {
    headers: { 'Authorization': `Bearer ${process.env.ACCOUNT_AGGREGATOR_KEY}` },
  });

  if (!response.ok) {
    const err = new Error('Account Aggregator service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Fetch bank statement after consent
 */
async function fetchStatement(consentId, months, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 800));

    const consent = sandboxConsents.get(consentId);
    if (!consent) {
      const err = new Error('Consent ID not found');
      err.code = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    if (consent.status !== 'APPROVED') {
      const err = new Error('Consent has not been approved by the user');
      err.code = 'CONSENT_PENDING';
      throw err;
    }

    // Generate sample transactions
    const transactions = generateSampleTransactions(months);
    const summary = analyzeSampleTransactions(transactions);

    return {
      accountHolder: 'Rahul Sharma',
      bankName: 'State Bank of India',
      accountType: 'SAVINGS',
      accountNumber: 'XXXX XXXX 4521',
      ifsc: 'SBIN0001234',
      months: months,
      summary,
      transactions,
      creditScore: 742,
    };
  }

  // Production
  const response = await fetch(`${process.env.ACCOUNT_AGGREGATOR_URL}/statement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ACCOUNT_AGGREGATOR_KEY}`,
    },
    body: JSON.stringify({ consentId, months }),
  });

  if (!response.ok) {
    const err = new Error('Account Aggregator service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

function generateSampleTransactions(months) {
  const transactions = [];
  const now = new Date();

  for (let m = 0; m < months; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);

    // Salary credit
    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split('T')[0],
      description: 'SALARY CREDIT - TECH CORP LTD',
      amount: 75000,
      type: 'CREDIT',
      balance: 85000 + Math.random() * 10000,
    });

    // EMI debit
    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5).toISOString().split('T')[0],
      description: 'EMI - HOME LOAN HDFC',
      amount: -18500,
      type: 'DEBIT',
      balance: 66500 + Math.random() * 5000,
    });

    // Utility bills
    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10).toISOString().split('T')[0],
      description: 'ELECTRICITY BILL - BESCOM',
      amount: -2400,
      type: 'DEBIT',
      balance: 64000 + Math.random() * 3000,
    });

    // Grocery
    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15).toISOString().split('T')[0],
      description: 'UPI - BIGBASKET',
      amount: -3200,
      type: 'DEBIT',
      balance: 60800 + Math.random() * 2000,
    });
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function analyzeSampleTransactions(transactions) {
  const credits = transactions.filter((t) => t.type === 'CREDIT');
  const debits = transactions.filter((t) => t.type === 'DEBIT');

  const totalCredit = credits.reduce((sum, t) => sum + t.amount, 0);
  const totalDebit = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const months = Math.max(1, Math.ceil(transactions.length / 4));

  return {
    avgMonthlyBalance: Math.round((totalCredit - totalDebit) / months),
    avgMonthlyCredit: Math.round(totalCredit / months),
    avgMonthlyDebit: Math.round(totalDebit / months),
    salaryCredits: credits
      .filter((t) => t.description.includes('SALARY'))
      .map((t) => t.amount),
    emiDebits: debits
      .filter((t) => t.description.includes('EMI'))
      .map((t) => Math.abs(t.amount)),
    bouncedCheques: 0,
  };
}

module.exports = { requestConsent, getConsentStatus, fetchStatement };
