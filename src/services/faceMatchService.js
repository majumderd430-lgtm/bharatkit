/**
 * Face match service - compares selfie with Aadhaar photo
 */
async function matchFaces(selfieBase64, aadhaarPhotoBase64, isSandbox) {
  if (isSandbox) {
    await new Promise((r) => setTimeout(r, 800));

    // Sandbox: always return high confidence match
    return {
      matched: true,
      confidenceScore: 95.7,
      livenessDetected: true,
      fraudRisk: 'LOW',
      details: {
        facialSimilarity: 95.7,
        livenessScore: 98.2,
        spoofDetection: 'PASSED',
        qualityScore: 87.4,
      },
    };
  }

  // Production: call real face match engine
  // This would integrate with a service like AWS Rekognition, Azure Face API, etc.
  const response = await fetch(process.env.FACE_MATCH_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FACE_MATCH_API_KEY}`,
    },
    body: JSON.stringify({
      image1: selfieBase64,
      image2: aadhaarPhotoBase64,
    }),
  });

  if (!response.ok) {
    const err = new Error('Face match service unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Validate base64 image
 */
function validateBase64Image(base64String) {
  // Check if it's a valid base64 string
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  const stripped = base64String.replace(/^data:image\/[a-z]+;base64,/, '');

  if (!base64Regex.test(stripped)) {
    return { valid: false, error: 'Invalid base64 encoding' };
  }

  // Check size (2MB limit)
  const sizeInBytes = (stripped.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB > 2) {
    return { valid: false, error: 'Image size exceeds 2MB limit' };
  }

  return { valid: true };
}

module.exports = { matchFaces, validateBase64Image };
