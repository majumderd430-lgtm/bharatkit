const env = require('../config/env');

// Sandbox test data
const SANDBOX_AADHAAR_DATA = {
  verified: true,
  name: 'Rahul Sharma',
  dob: '1990-05-15',
  gender: 'M',
  address: {
    house: '42',
    street: 'MG Road',
    locality: 'Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    country: 'India',
  },
  photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/sandbox_photo_placeholder',
  maskedAadhaar: 'XXXX-XXXX-9012',
};

/**
 * Send OTP to Aadhaar-linked mobile
 */
async function sendAadhaarOtp(aadhaarNumber, isSandbox) {
  if (isSandbox) {
    // Simulate delay
    await new Promise((r) => setTimeout(r, 300));
    const lastFour = aadhaarNumber.slice(-4);
    return {
      otpSent: true,
      maskedMobile: `XXXXXX${lastFour.substring(0, 2)}90`,
      txnId: `TXN_SANDBOX_${Date.now()}`,
    };
  }

  // Production: call real UIDAI API
  const response = await fetch(`${env.UIDAI_API_URL}/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.UIDAI_API_KEY}`,
    },
    body: JSON.stringify({ aadhaarNumber }),
  });

  if (!response.ok) {
    const err = new Error('UIDAI OTP service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Verify Aadhaar with OTP
 */
async function verifyAadhaar(aadhaarNumber, otp, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 500));

    // Sandbox: OTP 123456 always works
    if (otp !== '123456') {
      const err = new Error('Invalid OTP. Use 123456 in sandbox mode.');
      err.code = 'OTP_INVALID';
      throw err;
    }

    return { ...SANDBOX_AADHAAR_DATA };
  }

  // Production: call real UIDAI API
  const response = await fetch(`${env.UIDAI_API_URL}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.UIDAI_API_KEY}`,
    },
    body: JSON.stringify({ aadhaarNumber, otp }),
  });

  if (!response.ok) {
    const data = await response.json();
    const err = new Error(data.message || 'Aadhaar verification failed');
    err.code = data.code || 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

module.exports = { sendAadhaarOtp, verifyAadhaar };
