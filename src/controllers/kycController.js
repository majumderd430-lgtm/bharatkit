const { v4: uuidv4 } = require('uuid');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logUsage } = require('../services/billingService');
const aadhaarService = require('../services/aadhaarService');
const panService = require('../services/panService');
const faceMatchService = require('../services/faceMatchService');

const COSTS = {
  aadhaar: 2,
  aadhaarOtp: 0,
  pan: 1,
  faceMatch: 3,
  fullKyc: 8,
};

/**
 * POST /api/v1/kyc/aadhaar/send-otp
 */
async function sendAadhaarOtp(req, res, next) {
  const startTime = Date.now();
  try {
    const { aadhaarNumber } = req.body;

    // Validate Aadhaar format
    const cleanAadhaar = aadhaarNumber.replace(/[\s-]/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return errorResponse(res, 400, 'INVALID_AADHAAR', 'Aadhaar number format is invalid. Must be 12 digits.');
    }

    const result = await aadhaarService.sendAadhaarOtp(cleanAadhaar, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/kyc/aadhaar/send-otp', 'kyc',
      200, Date.now() - startTime, COSTS.aadhaarOtp, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/kyc/aadhaar/send-otp', 'kyc',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

/**
 * POST /api/v1/kyc/aadhaar
 */
async function verifyAadhaar(req, res, next) {
  const startTime = Date.now();
  try {
    const { aadhaarNumber, otp } = req.body;

    // Validate Aadhaar
    const cleanAadhaar = aadhaarNumber.replace(/[\s-]/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return errorResponse(res, 400, 'INVALID_AADHAAR', 'Aadhaar number format is invalid. Must be 12 digits.');
    }

    // Validate OTP
    if (!/^\d{6}$/.test(otp)) {
      return errorResponse(res, 400, 'OTP_INVALID', 'OTP must be 6 digits.');
    }

    const result = await aadhaarService.verifyAadhaar(cleanAadhaar, otp, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/kyc/aadhaar', 'kyc',
      200, Date.now() - startTime, COSTS.aadhaar, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    const statusCode = error.code === 'OTP_INVALID' ? 400 : 500;
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/kyc/aadhaar', 'kyc',
      statusCode, Date.now() - startTime, 0, req.environment
    );

    if (error.code) {
      return errorResponse(res, statusCode, error.code, error.message);
    }
    next(error);
  }
}

/**
 * POST /api/v1/kyc/pan
 */
async function verifyPan(req, res, next) {
  const startTime = Date.now();
  try {
    const { panNumber, name, dob } = req.body;

    // Validate PAN format
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      return errorResponse(res, 400, 'INVALID_PAN', 'PAN format is invalid. Must be like ABCDE1234F.');
    }

    const result = await panService.verifyPan(panNumber.toUpperCase(), name, dob, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/kyc/pan', 'kyc',
      200, Date.now() - startTime, COSTS.pan, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/kyc/pan', 'kyc',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

/**
 * POST /api/v1/kyc/face-match
 */
async function faceMatch(req, res, next) {
  const startTime = Date.now();
  try {
    const { selfieBase64, aadhaarPhotoBase64 } = req.body;

    // Validate images
    const selfieValidation = faceMatchService.validateBase64Image(selfieBase64);
    if (!selfieValidation.valid) {
      return errorResponse(res, 400, 'INVALID_IMAGE', `Selfie image: ${selfieValidation.error}`);
    }

    const aadhaarValidation = faceMatchService.validateBase64Image(aadhaarPhotoBase64);
    if (!aadhaarValidation.valid) {
      return errorResponse(res, 400, 'INVALID_IMAGE', `Aadhaar photo: ${aadhaarValidation.error}`);
    }

    const result = await faceMatchService.matchFaces(selfieBase64, aadhaarPhotoBase64, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/kyc/face-match', 'kyc',
      200, Date.now() - startTime, COSTS.faceMatch, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/kyc/face-match', 'kyc',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

/**
 * POST /api/v1/kyc/full
 */
async function fullKyc(req, res, next) {
  const startTime = Date.now();
  try {
    const { aadhaarNumber, panNumber, selfieBase64, otp } = req.body;

    // Validate inputs
    const cleanAadhaar = aadhaarNumber.replace(/[\s-]/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return errorResponse(res, 400, 'INVALID_AADHAAR', 'Aadhaar number format is invalid. Must be 12 digits.');
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      return errorResponse(res, 400, 'INVALID_PAN', 'PAN format is invalid. Must be like ABCDE1234F.');
    }

    if (!/^\d{6}$/.test(otp)) {
      return errorResponse(res, 400, 'OTP_INVALID', 'OTP must be 6 digits.');
    }

    // Run all verifications in parallel
    const [aadhaarResult, panResult, faceResult] = await Promise.allSettled([
      aadhaarService.verifyAadhaar(cleanAadhaar, otp, req.isSandbox),
      panService.verifyPan(panNumber.toUpperCase(), '', '', req.isSandbox),
      selfieBase64
        ? faceMatchService.matchFaces(selfieBase64, '', req.isSandbox)
        : Promise.resolve(null),
    ]);

    const aadhaarData = aadhaarResult.status === 'fulfilled' ? aadhaarResult.value : null;
    const panData = panResult.status === 'fulfilled' ? panResult.value : null;
    const faceData = faceResult.status === 'fulfilled' ? faceResult.value : null;

    // Calculate risk score
    let riskScore = 100;
    const fraudFlags = [];

    if (!aadhaarData?.verified) { riskScore -= 40; fraudFlags.push('AADHAAR_VERIFICATION_FAILED'); }
    if (!panData?.verified) { riskScore -= 30; fraudFlags.push('PAN_VERIFICATION_FAILED'); }
    if (faceData && !faceData.matched) { riskScore -= 20; fraudFlags.push('FACE_MATCH_FAILED'); }
    if (faceData && faceData.confidenceScore < 70) { riskScore -= 10; fraudFlags.push('LOW_FACE_CONFIDENCE'); }
    if (!panData?.linkedToAadhaar) { riskScore -= 5; fraudFlags.push('PAN_NOT_LINKED_TO_AADHAAR'); }

    riskScore = Math.max(0, riskScore);

    let kycStatus = 'COMPLETE';
    if (riskScore < 40) kycStatus = 'FAILED';
    else if (riskScore < 70) kycStatus = 'PARTIAL';

    const kycId = `KYC_${uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()}`;

    const response = {
      kycStatus,
      riskScore,
      fraudFlags,
      kycId,
      identity: aadhaarData ? {
        name: aadhaarData.name,
        dob: aadhaarData.dob,
        gender: aadhaarData.gender,
        address: aadhaarData.address,
        photo: aadhaarData.photo,
      } : null,
      pan: panData ? {
        verified: panData.verified,
        active: panData.panStatus === 'ACTIVE',
        linkedToAadhaar: panData.linkedToAadhaar,
        panType: panData.panType,
      } : null,
      faceMatch: faceData ? {
        matched: faceData.matched,
        confidence: faceData.confidenceScore,
      } : null,
      completedAt: new Date().toISOString(),
    };

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/kyc/full', 'kyc',
      200, Date.now() - startTime, COSTS.fullKyc, req.environment
    );

    return successResponse(res, response);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/kyc/full', 'kyc',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

module.exports = { sendAadhaarOtp, verifyAadhaar, verifyPan, faceMatch, fullKyc };
