const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { validateJWT } = require('../middleware/auth');

// All billing routes require JWT (dashboard auth)
router.use(validateJWT);

// GET /api/v1/billing/usage
router.get('/usage', billingController.getUsage);

// GET /api/v1/billing/usage/history
router.get('/usage/history', billingController.getUsageHistory);

// GET /api/v1/billing/invoices
router.get('/invoices', billingController.getInvoices);

// POST /api/v1/billing/pay
router.post('/pay', billingController.createPaymentOrder);

// Export webhook handler separately so server.js can mount it
// BEFORE express.json() for raw body access
router.webhookHandler = billingController.handleWebhook;

module.exports = router;
