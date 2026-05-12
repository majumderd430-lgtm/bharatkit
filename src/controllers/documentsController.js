const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logUsage } = require('../services/billingService');
const digilockerService = require('../services/digilockerService');

const VALID_DOCUMENT_TYPES = ['driving_licence', 'vehicle_rc', 'degree_certificate', 'voter_id', 'passport'];

/**
 * POST /api/v1/documents/request-access
 */
async function requestAccess(req, res, next) {
  const startTime = Date.now();
  try {
    const { userId, userMobile, documentType } = req.body;

    if (!userId || !userMobile || !documentType) {
      return errorResponse(res, 400, 'MISSING_FIELD', 'userId, userMobile, and documentType are required.');
    }

    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      return errorResponse(res, 400, 'INVALID_DOCUMENT_TYPE',
        `documentType must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`);
    }

    if (!/^[6-9]\d{9}$/.test(userMobile)) {
      return errorResponse(res, 400, 'INVALID_MOBILE', 'Mobile number must be a valid 10-digit Indian number.');
    }

    const result = await digilockerService.requestAccess(userId, userMobile, documentType, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/documents/request-access', 'documents',
      200, Date.now() - startTime, 1, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/documents/request-access', 'documents',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

/**
 * POST /api/v1/documents/verify
 */
async function verifyDocument(req, res, next) {
  const startTime = Date.now();
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return errorResponse(res, 400, 'MISSING_FIELD', 'requestId is required.');
    }

    const result = await digilockerService.verifyDocument(requestId, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/documents/verify', 'documents',
      200, Date.now() - startTime, 1, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    const statusCode = error.code === 'DOCUMENT_NOT_FOUND' ? 404 : 500;
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/documents/verify', 'documents',
      statusCode, Date.now() - startTime, 0, req.environment
    );

    if (error.code) {
      return errorResponse(res, statusCode, error.code, error.message);
    }
    next(error);
  }
}

/**
 * POST /api/v1/documents/verify-driving-licence
 */
async function verifyDrivingLicence(req, res, next) {
  const startTime = Date.now();
  try {
    const { licenceNumber, dob, name } = req.body;

    if (!licenceNumber || !dob) {
      return errorResponse(res, 400, 'MISSING_FIELD', 'licenceNumber and dob are required.');
    }

    const result = await digilockerService.verifyDrivingLicence(licenceNumber, dob, name, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/documents/verify-driving-licence', 'documents',
      200, Date.now() - startTime, 1.5, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/documents/verify-driving-licence', 'documents',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

module.exports = { requestAccess, verifyDocument, verifyDrivingLicence };
