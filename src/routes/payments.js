const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const paymentsController = require('../controllers/paymentsController');
const { validateApiKey } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimit');
const { errorResponse } = require('../utils/responseFormatter');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'VALIDATION_ERROR', errors.array()[0].msg);
  }
  next();
}

router.use(validateApiKey, rateLimiter);

// POST /api/v1/payments/upi/verify-id
router.post('/upi/verify-id', [
  body('upiId').notEmpty().withMessage('upiId is required.'),
  validate,
], paymentsController.verifyUpiId);

// POST /api/v1/payments/upi/send
router.post('/upi/send', [
  body('toUpiId').notEmpty().withMessage('toUpiId is required.'),
  body('amount').isNumeric().withMessage('amount must be a number.'),
  body('merchantOrderId').notEmpty().withMessage('merchantOrderId is required.'),
  validate,
], paymentsController.sendPayment);

// GET /api/v1/payments/upi/status/:transactionId
router.get('/upi/status/:transactionId', paymentsController.getTransactionStatus);

// POST /api/v1/payments/upi/refund
router.post('/upi/refund', [
  body('transactionId').notEmpty().withMessage('transactionId is required.'),
  body('amount').isNumeric().withMessage('amount must be a number.'),
  validate,
], paymentsController.initiateRefund);

module.exports = router;
