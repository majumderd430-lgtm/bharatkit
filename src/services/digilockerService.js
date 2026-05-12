const { v4: uuidv4 } = require('uuid');

// Sandbox request store
const sandboxRequests = new Map();

const DOCUMENT_TEMPLATES = {
  driving_licence: {
    documentType: 'driving_licence',
    documentNumber: 'DL-TEST-001',
    holderName: 'Rahul Sharma',
    issuedBy: 'Regional Transport Office, Bengaluru',
    issuedDate: '2015-03-20',
    validUntil: '2035-03-19',
    isActive: true,
    rawData: {
      licenceClass: ['LMV', 'MCWG'],
      bloodGroup: 'B+',
      address: '42, MG Road, Koramangala, Bengaluru - 560034',
    },
  },
  vehicle_rc: {
    documentType: 'vehicle_rc',
    documentNumber: 'KA01AB1234',
    holderName: 'Rahul Sharma',
    issuedBy: 'Regional Transport Office, Bengaluru',
    issuedDate: '2020-06-15',
    validUntil: '2035-06-14',
    isActive: true,
    rawData: {
      vehicleClass: 'LMV',
      fuelType: 'Petrol',
      engineNumber: 'ENG123456',
      chassisNumber: 'CHS789012',
    },
  },
  degree_certificate: {
    documentType: 'degree_certificate',
    documentNumber: 'CERT-2012-BCS-001',
    holderName: 'Rahul Sharma',
    issuedBy: 'Visvesvaraya Technological University',
    issuedDate: '2012-07-15',
    validUntil: null,
    isActive: true,
    rawData: {
      degree: 'Bachelor of Computer Science',
      specialization: 'Computer Science & Engineering',
      grade: 'First Class with Distinction',
      rollNumber: 'VTU2008CS001',
    },
  },
  voter_id: {
    documentType: 'voter_id',
    documentNumber: 'KA/01/234/567890',
    holderName: 'Rahul Sharma',
    issuedBy: 'Election Commission of India',
    issuedDate: '2010-01-01',
    validUntil: null,
    isActive: true,
    rawData: {
      constituency: 'Bengaluru South',
      assemblyNumber: '175',
      partNumber: '42',
    },
  },
  passport: {
    documentType: 'passport',
    documentNumber: 'P1234567',
    holderName: 'Rahul Sharma',
    issuedBy: 'Passport Seva Kendra, Bengaluru',
    issuedDate: '2018-09-10',
    validUntil: '2028-09-09',
    isActive: true,
    rawData: {
      nationality: 'Indian',
      placeOfBirth: 'Bengaluru',
      fileNumber: 'BLR1234567',
    },
  },
};

/**
 * Request DigiLocker access
 */
async function requestAccess(userId, userMobile, documentType, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 300));

    const requestId = `DLREQ_SANDBOX_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    sandboxRequests.set(requestId, {
      requestId,
      userId,
      userMobile,
      documentType,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return {
      requestId,
      digilockerUrl: `https://sandbox.bharatkit.dev/digilocker/${requestId}`,
      expiresAt: expiresAt.toISOString(),
      status: 'PENDING',
    };
  }

  // Production: call real DigiLocker API
  const response = await fetch(`${process.env.DIGILOCKER_API_URL}/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'client_id': process.env.DIGILOCKER_CLIENT_ID,
      'client_secret': process.env.DIGILOCKER_CLIENT_SECRET,
    },
    body: JSON.stringify({ userId, userMobile, documentType }),
  });

  if (!response.ok) {
    const err = new Error('DigiLocker service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Verify document from DigiLocker
 */
async function verifyDocument(requestId, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 500));

    const request = sandboxRequests.get(requestId);
    if (!request) {
      const err = new Error('Request ID not found');
      err.code = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    const template = DOCUMENT_TEMPLATES[request.documentType];
    if (!template) {
      const err = new Error('Document type not supported');
      err.code = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    return { verified: true, ...template };
  }

  // Production
  const response = await fetch(`${process.env.DIGILOCKER_API_URL}/verify/${requestId}`, {
    headers: {
      'client_id': process.env.DIGILOCKER_CLIENT_ID,
      'client_secret': process.env.DIGILOCKER_CLIENT_SECRET,
    },
  });

  if (!response.ok) {
    const err = new Error('DigiLocker service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Direct driving licence verification
 */
async function verifyDrivingLicence(licenceNumber, dob, name, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 400));

    return {
      verified: true,
      holderName: 'Rahul Sharma',
      validUntil: '2035-03-19',
      vehicleClasses: ['LMV', 'MCWG'],
      issuingRTO: 'RTO Bengaluru South (KA-01)',
      blacklisted: false,
      licenceNumber,
      dob,
    };
  }

  // Production: call Sarathi/Vahan API
  const response = await fetch(`${process.env.VAHAN_API_URL}/dl/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VAHAN_API_KEY}`,
    },
    body: JSON.stringify({ licenceNumber, dob, name }),
  });

  if (!response.ok) {
    const err = new Error('Driving licence verification service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

module.exports = { requestAccess, verifyDocument, verifyDrivingLicence };
