const prisma = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseFormatter');
const billingService = require('../services/billingService');

/**
 * GET /api/v1/billing/usage
 */
async function getUsage(req, res, next) {
  try {
    const usage = await billingService.getCurrentMonthUsage(req.developer.id);
    return successResponse(res, usage);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/billing/usage/history
 */
async function getUsageHistory(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      prisma.apiUsage.findMany({
        where: { developerId: req.developer.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          endpoint: true,
          service: true,
          responseStatus: true,
          responseTime: true,
          cost: true,
          environment: true,
          createdAt: true,
        },
      }),
      prisma.apiUsage.count({ where: { developerId: req.developer.id } }),
    ]);

    return paginatedResponse(res, records, total, page, limit);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/billing/pay
 */
async function createPaymentOrder(req, res, next) {
  try {
    const result = await billingService.createBillingOrder(req.developer.id);
    return successResponse(res, result);
  } catch (error) {
    if (error.message === 'Payment gateway not configured') {
      return errorResponse(res, 503, 'PAYMENT_GATEWAY_UNAVAILABLE', 'Payment gateway is not configured.');
    }
    next(error);
  }
}

/**
 * POST /api/v1/billing/webhook
 * Uses raw body for Razorpay signature verification
 */
async function handleWebhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return errorResponse(res, 400, 'MISSING_SIGNATURE', 'Webhook signature is missing.');
    }

    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === 'placeholder_secret') {
      return errorResponse(res, 503, 'PAYMENT_GATEWAY_UNAVAILABLE', 'Payment gateway not configured.');
    }

    // req.body is a Buffer when using express.raw()
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const payload = JSON.parse(rawBody.toString());

    const result = await billingService.handlePaymentWebhook(rawBody, payload, signature);
    return successResponse(res, result);
  } catch (error) {
    if (error.code === 'INVALID_SIGNATURE') {
      return errorResponse(res, 401, 'INVALID_SIGNATURE', 'Webhook signature verification failed.');
    }
    next(error);
  }
}

/**
 * GET /api/v1/billing/invoices
 */
async function getInvoices(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where: { developerId: req.developer.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.bill.count({ where: { developerId: req.developer.id } }),
    ]);

    return paginatedResponse(res, bills, total, page, limit);
  } catch (error) {
    next(error);
  }
}

module.exports = { getUsage, getUsageHistory, createPaymentOrder, handleWebhook, getInvoices };
