const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { validateJWT } = require('../middleware/auth');
const { errorResponse } = require('../utils/responseFormatter');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return errorResponse(res, 400, 'VALIDATION_ERROR', firstError.msg);
  }
  next();
}

// POST /api/v1/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('companyName').trim().notEmpty().withMessage('Company name is required.'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number is required.'),
  validate,
], authController.register);

// POST /api/v1/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  validate,
], authController.login);

// GET /api/v1/auth/me
router.get('/me', validateJWT, authController.getMe);

// POST /api/v1/auth/regenerate-key
router.post('/regenerate-key', validateJWT, [
  body('keyId').notEmpty().withMessage('keyId is required.'),
  validate,
], authController.regenerateKey);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  validate,
], authController.forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('token is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  validate,
], authController.resetPassword);

// POST /api/v1/auth/change-password (requires JWT)
router.post('/change-password', validateJWT, [
  body('currentPassword').notEmpty().withMessage('currentPassword is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  validate,
], authController.changePassword);

module.exports = router;
