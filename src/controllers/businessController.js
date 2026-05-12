const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logUsage } = require('../services/billingService');
const gstService = require('../services/gstService');

/**
 * POST /api/v1/business/verify-gst
 */
async function verifyGst(req, res, next) {
  const startTime = Date.now();
  try {
    const { gstin } = req.body;

    // Validate GSTIN format: 15 characters
    // Format: 2 digit state code + 10 char PAN + 1 entity number + Z + 1 checksum
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase())) {
      return errorResponse(res, 400, 'INVALID_GSTIN',
        'GSTIN format is invalid. Must be 15 characters like 27AAPFU0939F1ZV.');
    }

    const result = await gstService.verifyGst(gstin.toUpperCase(), req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/business/verify-gst', 'business',
      200, Date.now() - startTime, 1, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/business/verify-gst', 'business',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

/**
 * POST /api/v1/business/verify-pan-business
 */
async function verifyBusinessPan(req, res, next) {
  const startTime = Date.now();
  try {
    const { pan, businessName } = req.body;

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      return errorResponse(res, 400, 'INVALID_PAN', 'PAN format is invalid. Must be like AAPFU0939F.');
    }

    const result = await gstService.verifyBusinessPan(pan.toUpperCase(), businessName, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/business/verify-pan-business', 'business',
      200, Date.now() - startTime, 1, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/business/verify-pan-business', 'business',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

/**
 * POST /api/v1/business/full-check
 */
async function fullBusinessCheck(req, res, next) {
  const startTime = Date.now();
  try {
    const { gstin, pan } = req.body;

    if (!gstin || !pan) {
      return errorResponse(res, 400, 'MISSING_FIELD', 'Both gstin and pan are required.');
    }

    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase())) {
      return errorResponse(res, 400, 'INVALID_GSTIN', 'GSTIN format is invalid.');
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      return errorResponse(res, 400, 'INVALID_PAN', 'PAN format is invalid.');
    }

    // Run both checks in parallel
    const [gstResult, panResult] = await Promise.allSettled([
      gstService.verifyGst(gstin.toUpperCase(), req.isSandbox),
      gstService.verifyBusinessPan(pan.toUpperCase(), '', req.isSandbox),
    ]);

    const gstData = gstResult.status === 'fulfilled' ? gstResult.value : null;
    const panData = panResult.status === 'fulfilled' ? panResult.value : null;

    // Risk assessment
    const riskFactors = [];
    let riskLevel = 'low';

    if (!gstData?.verified) riskFactors.push('GST_VERIFICATION_FAILED');
    if (!panData?.verified) riskFactors.push('PAN_VERIFICATION_FAILED');
    if (gstData?.gstStatus !== 'active') riskFactors.push('GST_NOT_ACTIVE');
    if (gstData?.filingStatus === 'irregular') riskFactors.push('IRREGULAR_GST_FILING');
    if (!panData?.active) riskFactors.push('PAN_INACTIVE');

    if (riskFactors.length >= 3) riskLevel = 'high';
    else if (riskFactors.length >= 1) riskLevel = 'medium';

    let creditworthiness = 'good';
    if (riskLevel === 'high') creditworthiness = 'poor';
    else if (riskLevel === 'medium') creditworthiness = 'fair';

    const businessVerified = gstData?.verified && panData?.verified;

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/business/full-check', 'business',
      200, Date.now() - startTime, 2.5, req.environment
    );

    return successResponse(res, {
      businessVerified,
      riskLevel,
      riskFactors,
      gst: gstData,
      pan: panData,
      creditworthiness,
    });
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/business/full-check', 'business',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

module.exports = { verifyGst, verifyBusinessPan, fullBusinessCheck };
