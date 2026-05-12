const env = require('../config/env');

/**
 * Verify GSTIN
 */
async function verifyGst(gstin, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 500));

    return {
      verified: true,
      gstin,
      legalName: 'TECH SOLUTIONS PRIVATE LIMITED',
      tradeName: 'TechSolutions',
      registeredAddress: {
        building: 'No. 42, 3rd Floor',
        street: 'MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      registrationDate: '2018-04-01',
      gstStatus: 'active',
      taxPayerType: 'Regular',
      filingStatus: 'regular',
      lastFiledReturn: 'GSTR-3B',
      lastFiledPeriod: '2024-01',
      annualTurnoverBand: '5 Crore - 10 Crore',
      constitutionOfBusiness: 'Private Limited Company',
    };
  }

  // Production: call real GST portal API
  const response = await fetch(`${env.GST_API_URL}/taxpayerapi/v2.0/returns/gstdetails?gstin=${gstin}`, {
    headers: {
      'Authorization': `Bearer ${env.GST_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = new Error('GST portal service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Verify business PAN
 */
async function verifyBusinessPan(pan, businessName, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 400));

    return {
      verified: true,
      legalName: 'TECH SOLUTIONS PRIVATE LIMITED',
      businessType: 'Private Limited Company',
      registrationDate: '2017-11-15',
      active: true,
      pan,
      cin: 'U72900KA2017PTC123456',
      registeredOffice: 'Bengaluru, Karnataka',
    };
  }

  // Production
  const response = await fetch(`${env.GST_API_URL}/pan/business/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.GST_API_KEY}`,
    },
    body: JSON.stringify({ pan, businessName }),
  });

  if (!response.ok) {
    const err = new Error('Business PAN verification service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

module.exports = { verifyGst, verifyBusinessPan };
