const { v4: uuidv4 } = require('uuid');
const { logger } = require('./logger');

function errorHandler(err, req, res, next) {
  const requestId = `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

  logger.error({
    message: err.message,
    stack: err.stack,
    requestId,
    path: req.path,
    method: req.method,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this value already exists.',
        docs: 'https://bharatkit.dev/docs/errors#duplicate_entry',
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token.',
        docs: 'https://bharatkit.dev/docs/errors#invalid_token',
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired.',
        docs: 'https://bharatkit.dev/docs/errors#token_expired',
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  // Validation errors
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      error: {
        code: err.code || 'VALIDATION_ERROR',
        message: err.message,
        docs: `https://bharatkit.dev/docs/errors#${(err.code || 'validation_error').toLowerCase()}`,
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  // Default 500
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An internal server error occurred.'
        : err.message,
      docs: 'https://bharatkit.dev/docs/errors#internal_error',
    },
    requestId,
    timestamp: new Date().toISOString(),
  });
}

module.exports = errorHandler;
