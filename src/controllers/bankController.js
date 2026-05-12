const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logUsage } = require('../services/billingService');
const aaService = require('../services/accountAggregatorService');

/**
 * POST /api/v1/bank/request-consent
 */
async function requestConsent(req, res, next) {
  const startTime = Date.now();
  try {
    const { userId, userMobile, months } = req.body;

    if (!userId || !userMobile) {
      return errorResponse(res, 400, 'MISSING_FIELD', 'userId and userMobile are required.');
    }

    if (!/^[6-9]\d{9}$/.test(userMobile)) {
      return errorResponse(res, 400, 'INVALID_MOBILE', 'Mobile number must be a valid 10-digit Indian number.');
    }

    const monthsNum = parseInt(months) || 6;
    if (monthsNum < 1 || monthsNum > 24) {
      return errorResponse(res, 400, 'INVALID_MONTHS', 'Months must be between 1 and 24.');
    }

    const result = await aaService.requestConsent(userId, userMobile, monthsNum, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/bank/request-consent', 'bank',
      200, Date.now() - startTime, 2, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/bank/request-consent', 'bank',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

/**
 * GET /api/v1/bank/consent-status/:consentId
 */
async function getConsentStatus(req, res, next) {
  const startTime = Date.now();
  try {
    const { consentId } = req.params;

    const result = await aaService.getConsentStatus(consentId, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      `/api/v1/bank/consent-status/${consentId}`, 'bank',
      200, Date.now() - startTime, 0, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    const statusCode = error.code === 'DOCUMENT_NOT_FOUND' ? 404 : 500;
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/bank/consent-status/:id', 'bank',
      statusCode, Date.now() - startTime, 0, req.environment
    );

    if (error.code) {
      return errorResponse(res, statusCode, error.code, error.message);
    }
    next(error);
  }
}

/**
 * POST /api/v1/bank/fetch-statement
 */
async function fetchStatement(req, res, next) {
  const startTime = Date.now();
  try {
    const { consentId, months } = req.body;

    if (!consentId) {
      return errorResponse(res, 400, 'MISSING_FIELD', 'consentId is required.');
    }

    const monthsNum = parseInt(months) || 6;

    const result = await aaService.fetchStatement(consentId, monthsNum, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/bank/fetch-statement', 'bank',
      200, Date.now() - startTime, 5, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    const statusCode = error.code === 'CONSENT_PENDING' ? 400
      : error.code === 'DOCUMENT_NOT_FOUND' ? 404 : 500;

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/bank/fetch-statement', 'bank',
      statusCode, Date.now() - startTime, 0, req.environment
    );

    if (error.code) {
      return errorResponse(res, statusCode, error.code, error.message);
    }
    next(error);
  }
}

module.exports = { requestConsent, getConsentStatus, fetchStatement };
