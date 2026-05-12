const { v4: uuidv4 } = require('uuid');

/**
 * Format a successful API response
 */
function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    requestId: `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Format an error API response
 */
function errorResponse(res, statusCode, code, message, extra = {}) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      docs: `https://bharatkit.dev/docs/errors#${code.toLowerCase()}`,
      ...extra,
    },
    requestId: `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Paginate a list response
 */
function paginatedResponse(res, data, total, page, limit) {
  return res.status(200).json({
    success: true,
    requestId: `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  });
}

module.exports = { successResponse, errorResponse, paginatedResponse };
