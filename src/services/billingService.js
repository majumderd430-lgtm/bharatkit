const prisma = require('../config/database');
const env = require('../config/env');
const { enqueueUsageLog } = require('../utils/usageQueue');

let razorpay;
try {
  const Razorpay = require('razorpay');
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (e) {
  console.warn('Razorpay not configured:', e.message);
}

/**
 * Log API usage and calculate cost — uses retry queue for reliability
 */
async function logUsage(apiKeyId, developerId, endpoint, service, responseStatus, responseTime, cost, environment, requestBody = null) {
  enqueueUsageLog({
    apiKeyId,
    developerId,
    endpoint,
    service,
    requestBody: requestBody ? JSON.stringify(requestBody) : null,
    responseStatus,
    responseTime,
    cost: environment === 'sandbox' ? 0 : cost,
    environment,
  });
}

/**
 * Get current month usage for a developer
 */
async function getCurrentMonthUsage(developerId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const usage = await prisma.apiUsage.findMany({
    where: {
      developerId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  const breakdown = {
    kyc: { calls: 0, cost: 0 },
    payments: { calls: 0, cost: 0 },
    bank: { calls: 0, cost: 0 },
    documents: { calls: 0, cost: 0 },
    business: { calls: 0, cost: 0 },
  };

  usage.forEach((u) => {
    const service = u.service.toLowerCase();
    if (breakdown[service]) {
      breakdown[service].calls++;
      breakdown[service].cost += u.cost;
    }
  });

  // Round costs
  Object.keys(breakdown).forEach((k) => {
    breakdown[k].cost = Math.round(breakdown[k].cost * 100) / 100;
  });

  const totalCalls = usage.length;
  const totalCost = usage.reduce((sum, u) => sum + u.cost, 0);

  return {
    totalCalls,
    totalCost: Math.round(totalCost * 100) / 100,
    breakdown,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

/**
 * Create Razorpay order for billing
 */
async function createBillingOrder(developerId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Get or create bill
  let bill = await prisma.bill.findFirst({
    where: { developerId, month, year, status: 'pending' },
  });

  if (!bill) {
    const usage = await getCurrentMonthUsage(developerId);
    bill = await prisma.bill.create({
      data: {
        developerId,
        month,
        year,
        totalCalls: usage.totalCalls,
        totalCost: usage.totalCost,
        status: 'pending',
      },
    });
  }

  if (bill.totalCost <= 0) {
    return { message: 'No outstanding balance', bill };
  }

  if (!razorpay) {
    throw new Error('Payment gateway not configured');
  }

  // Create Razorpay order (amount in paise)
  const order = await razorpay.orders.create({
    amount: Math.round(bill.totalCost * 100),
    currency: 'INR',
    receipt: `bill_${bill.id}`,
    notes: {
      developerId,
      billId: bill.id,
      month: `${month}/${year}`,
    },
  });

  // Update bill with order ID
  await prisma.bill.update({
    where: { id: bill.id },
    data: { razorpayOrderId: order.id },
  });

  return {
    orderId: order.id,
    amount: bill.totalCost,
    currency: 'INR',
    billId: bill.id,
  };
}

/**
 * Handle Razorpay webhook
 * rawBody: Buffer, payload: parsed object, signature: string
 */
async function handlePaymentWebhook(rawBody, payload, signature) {
  const crypto = require('crypto');
  const secret = env.RAZORPAY_KEY_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    const err = new Error('Invalid webhook signature');
    err.code = 'INVALID_SIGNATURE';
    throw err;
  }

  const event = payload.event;

  if (event === 'payment.captured') {
    const orderId = payload.payload.payment.entity.order_id;
    await prisma.bill.updateMany({
      where: { razorpayOrderId: orderId },
      data: { status: 'paid', paidAt: new Date() },
    });
    return { processed: true, event };
  }

  if (event === 'payment.failed') {
    const orderId = payload.payload.payment.entity.order_id;
    await prisma.bill.updateMany({
      where: { razorpayOrderId: orderId },
      data: { status: 'failed' },
    });
    return { processed: true, event };
  }

  return { processed: false, event };
}

module.exports = { logUsage, getCurrentMonthUsage, createBillingOrder, handlePaymentWebhook };
