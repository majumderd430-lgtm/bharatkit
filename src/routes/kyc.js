const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const kycController = require('../controllers/kycController');
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

// All KYC routes require API key
router.use(validateApiKey, rateLimiter);

// POST /api/v1/kyc/aadhaar/send-otp
router.post('/aadhaar/send-otp', [
  body('aadhaarNumber').notEmpty().withMessage('aadhaarNumber is required.'),
  validate,
], kycController.sendAadhaarOtp);

// POST /api/v1/kyc/aadhaar
router.post('/aadhaar', [
  body('aadhaarNumber').notEmpty().withMessage('aadhaarNumber is required.'),
  body('otp').notEmpty().withMessage('otp is required.'),
  validate,
], kycController.verifyAadhaar);

// POST /api/v1/kyc/pan
router.post('/pan', [
  body('panNumber').notEmpty().withMessage('panNumber is required.'),
  body('name').notEmpty().withMessage('name is required.'),
  body('dob').notEmpty().withMessage('dob is required.'),
  validate,
], kycController.verifyPan);

// POST /api/v1/kyc/face-match
router.post('/face-match', [
  body('selfieBase64').notEmpty().withMessage('selfieBase64 is required.'),
  body('aadhaarPhotoBase64').notEmpty().withMessage('aadhaarPhotoBase64 is required.'),
  validate,
], kycController.faceMatch);

// POST /api/v1/kyc/full
router.post('/full', [
  body('aadhaarNumber').notEmpty().withMessage('aadhaarNumber is required.'),
  body('panNumber').notEmpty().withMessage('panNumber is required.'),
  body('otp').notEmpty().withMessage('otp is required.'),
  validate,
], kycController.fullKyc);

module.exports = router;
