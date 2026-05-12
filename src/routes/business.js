const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const businessController = require('../controllers/businessController');
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

// POST /api/v1/business/verify-gst
router.post('/verify-gst', [
  body('gstin').notEmpty().withMessage('gstin is required.'),
  validate,
], businessController.verifyGst);

// POST /api/v1/business/verify-pan-business
router.post('/verify-pan-business', [
  body('pan').notEmpty().withMessage('pan is required.'),
  validate,
], businessController.verifyBusinessPan);

// POST /api/v1/business/full-check
router.post('/full-check', [
  body('gstin').notEmpty().withMessage('gstin is required.'),
  body('pan').notEmpty().withMessage('pan is required.'),
  validate,
], businessController.fullBusinessCheck);

module.exports = router;
