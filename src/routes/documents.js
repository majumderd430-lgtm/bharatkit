const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const documentsController = require('../controllers/documentsController');
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

// POST /api/v1/documents/request-access
router.post('/request-access', [
  body('userId').notEmpty().withMessage('userId is required.'),
  body('userMobile').notEmpty().withMessage('userMobile is required.'),
  body('documentType').notEmpty().withMessage('documentType is required.'),
  validate,
], documentsController.requestAccess);

// POST /api/v1/documents/verify
router.post('/verify', [
  body('requestId').notEmpty().withMessage('requestId is required.'),
  validate,
], documentsController.verifyDocument);

// POST /api/v1/documents/verify-driving-licence
router.post('/verify-driving-licence', [
  body('licenceNumber').notEmpty().withMessage('licenceNumber is required.'),
  body('dob').notEmpty().withMessage('dob is required.'),
  validate,
], documentsController.verifyDrivingLicence);

module.exports = router;
