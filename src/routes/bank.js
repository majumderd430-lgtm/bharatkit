const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bankController = require('../controllers/bankController');
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

// POST /api/v1/bank/request-consent
router.post('/request-consent', [
  body('userId').notEmpty().withMessage('userId is required.'),
  body('userMobile').notEmpty().withMessage('userMobile is required.'),
  validate,
], bankController.requestConsent);

// GET /api/v1/bank/consent-status/:consentId
router.get('/consent-status/:consentId', bankController.getConsentStatus);

// POST /api/v1/bank/fetch-statement
router.post('/fetch-statement', [
  body('consentId').notEmpty().withMessage('consentId is required.'),
  validate,
], bankController.fetchStatement);

module.exports = router;
