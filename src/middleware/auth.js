const prisma = require('../config/database');
const { errorResponse } = require('../utils/responseFormatter');
const { getEnvironmentFromKey } = require('../utils/apiKeyGenerator');

/**
 * Middleware to validate API key from Authorization header
 */
async function validateApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'INVALID_API_KEY', 'API key is missing or invalid. Use: Authorization: Bearer bk_xxx');
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '

    // Validate key format
    if (!apiKey.startsWith('bk_sandbox_') && !apiKey.startsWith('bk_live_')) {
      return errorResponse(res, 401, 'INVALID_API_KEY', 'API key format is invalid. Must start with bk_sandbox_ or bk_live_');
    }

    // Find key in database
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { developer: true },
    });

    if (!keyRecord) {
      return errorResponse(res, 401, 'INVALID_API_KEY', 'API key not found or has been revoked.');
    }

    if (!keyRecord.isActive) {
      return errorResponse(res, 401, 'INVALID_API_KEY', 'API key has been deactivated.');
    }

    if (!keyRecord.developer.isActive) {
      return errorResponse(res, 403, 'ACCOUNT_SUSPENDED', 'Your developer account has been suspended. Contact support.');
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Attach to request
    req.apiKey = keyRecord;
    req.developer = keyRecord.developer;
    req.environment = getEnvironmentFromKey(apiKey);
    req.isSandbox = req.environment === 'sandbox';

    next();
  } catch (error) {
    console.error('API key validation error:', error);
    return errorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to validate API key.');
  }
}

/**
 * Middleware to validate JWT token for dashboard auth
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

async function validateJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'INVALID_TOKEN', 'Authentication token is missing.');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const developer = await prisma.developer.findUnique({
      where: { id: decoded.developerId },
    });

    if (!developer) {
      return errorResponse(res, 401, 'INVALID_TOKEN', 'Developer account not found.');
    }

    if (!developer.isActive) {
      return errorResponse(res, 403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended.');
    }

    req.developer = developer;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'INVALID_TOKEN', 'Invalid authentication token.');
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired.');
    }
    return errorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to validate token.');
  }
}

module.exports = { validateApiKey, validateJWT };
