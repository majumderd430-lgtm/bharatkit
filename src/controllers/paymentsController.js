const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logUsage } = require('../services/billingService');
const upiService = require('../services/upiService');

/**
 * POST /api/v1/payments/upi/verify-id
 */
async function verifyUpiId(req, res, next) {
  const startTime = Date.now();
  try {
    const { upiId } = req.body;

    // Validate UPI ID format
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId)) {
      return errorResponse(res, 400, 'INVALID_UPI_ID', 'UPI ID format is invalid. Must be like name@bank.');
    }

    const result = await upiService.verifyUpiId(upiId, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/payments/upi/verify-id', 'payments',
      200, Date.now() - startTime, 0.5, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/payments/upi/verify-id', 'payments',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

/**
 * POST /api/v1/payments/upi/send
 */
async function sendPayment(req, res, next) {
  const startTime = Date.now();
  try {
    const { toUpiId, amount, note, merchantOrderId } = req.body;

    // Validate UPI ID
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(toUpiId)) {
      return errorResponse(res, 400, 'INVALID_UPI_ID', 'UPI ID format is invalid. Must be like name@bank.');
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      return errorResponse(res, 400, 'INVALID_AMOUNT', 'Amount must be at least ₹1.');
    }
    if (amountNum > 100000) {
      return errorResponse(res, 400, 'INVALID_AMOUNT', 'Amount cannot exceed ₹1,00,000 per transaction.');
    }

    const result = await upiService.sendUpiPayment(toUpiId, amountNum, note, merchantOrderId, req.isSandbox);

    // Cost: 0.1% of transaction amount
    const cost = amountNum * 0.001;

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/payments/upi/send', 'payments',
      200, Date.now() - startTime, cost, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/payments/upi/send', 'payments',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

/**
 * GET /api/v1/payments/upi/status/:transactionId
 */
async function getTransactionStatus(req, res, next) {
  const startTime = Date.now();
  try {
    const { transactionId } = req.params;

    const result = await upiService.getTransactionStatus(transactionId, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      `/api/v1/payments/upi/status/${transactionId}`, 'payments',
      200, Date.now() - startTime, 0, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/payments/upi/status/:id', 'payments',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

/**
 * POST /api/v1/payments/upi/refund
 */
async function initiateRefund(req, res, next) {
  const startTime = Date.now();
  try {
    const { transactionId, amount, reason } = req.body;

    if (!transactionId) {
      return errorResponse(res, 400, 'MISSING_FIELD', 'transactionId is required.');
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return errorResponse(res, 400, 'INVALID_AMOUNT', 'Refund amount must be greater than 0.');
    }

    const result = await upiService.initiateRefund(transactionId, amountNum, reason, req.isSandbox);

    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/payments/upi/refund', 'payments',
      200, Date.now() - startTime, 1, req.environment
    );

    return successResponse(res, result);
  } catch (error) {
    await logUsage(
      req.apiKey.id, req.developer.id,
      '/api/v1/payments/upi/refund', 'payments',
      500, Date.now() - startTime, 0, req.environment
    );
    next(error);
  }
}

module.exports = { verifyUpiId, sendPayment, getTransactionStatus, initiateRefund };
