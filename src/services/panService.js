const env = require('../config/env');

/**
 * Verify PAN card
 */
async function verifyPan(panNumber, name, dob, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 400));

    // Sandbox: all valid format PANs return verified
    const nameMatch = name.toLowerCase().includes('sharma') || name.toLowerCase().includes('test');
    const dobMatch = dob === '1990-05-15' || dob === '1985-01-01';

    return {
      verified: true,
      nameMatch,
      dobMatch,
      panStatus: 'ACTIVE',
      panType: 'Individual',
      linkedToAadhaar: true,
      panHolder: 'RAHUL SHARMA',
    };
  }

  // Production: call real Income Tax API
  const response = await fetch(`${env.GST_API_URL}/pan/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.GST_API_KEY}`,
    },
    body: JSON.stringify({ panNumber, name, dob }),
  });

  if (!response.ok) {
    const err = new Error('PAN verification service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

module.exports = { verifyPan };
