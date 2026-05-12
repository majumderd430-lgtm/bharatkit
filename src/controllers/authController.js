const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');
const env = require('../config/env');
const { generateApiKey } = require('../utils/apiKeyGenerator');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logAudit } = require('../utils/auditLogger');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

/**
 * POST /api/v1/auth/register
 */
async function register(req, res, next) {
  try {
    const { email, password, companyName, phone } = req.body;

    // Check if email already exists
    const existing = await prisma.developer.findUnique({ where: { email } });
    if (existing) {
      return errorResponse(res, 409, 'EMAIL_EXISTS', 'An account with this email already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create developer
    const developer = await prisma.developer.create({
      data: { email, password: hashedPassword, companyName, phone },
    });

    // Generate API keys
    const sandboxKeyValue = generateApiKey('sandbox');
    const liveKeyValue = generateApiKey('production');

    const [sandboxKey, liveKey] = await Promise.all([
      prisma.apiKey.create({
        data: {
          developerId: developer.id,
          key: sandboxKeyValue,
          name: 'Default Sandbox Key',
          environment: 'sandbox',
        },
      }),
      prisma.apiKey.create({
        data: {
          developerId: developer.id,
          key: liveKeyValue,
          name: 'Default Production Key',
          environment: 'production',
        },
      }),
    ]);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, companyName, sandboxKeyValue, liveKeyValue).catch((err) =>
      console.error('Welcome email failed:', err.message)
    );

    // Audit log
    await logAudit(developer.id, 'DEVELOPER_REGISTERED', { email, companyName }, null, req);

    return successResponse(res, {
      developerId: developer.id,
      email: developer.email,
      companyName: developer.companyName,
      apiKeys: [
        {
          id: sandboxKey.id,
          name: sandboxKey.name,
          key: sandboxKeyValue,
          environment: 'sandbox',
          createdAt: sandboxKey.createdAt,
        },
        {
          id: liveKey.id,
          name: liveKey.name,
          key: liveKeyValue,
          environment: 'production',
          createdAt: liveKey.createdAt,
        },
      ],
    }, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const developer = await prisma.developer.findUnique({ where: { email } });

    // Use constant-time comparison to prevent timing attacks
    if (!developer) {
      await bcrypt.hash('dummy-prevent-timing-attack', 12);
      return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const passwordMatch = await bcrypt.compare(password, developer.password);
    if (!passwordMatch) {
      return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    if (!developer.isActive) {
      return errorResponse(res, 403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended. Contact support@bharatkit.dev');
    }

    const token = jwt.sign(
      { developerId: developer.id, email: developer.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit(developer.id, 'DEVELOPER_LOGIN', { email }, null, req);

    return successResponse(res, {
      token,
      developer: {
        id: developer.id,
        email: developer.email,
        companyName: developer.companyName,
        phone: developer.phone,
        createdAt: developer.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 */
async function getMe(req, res, next) {
  try {
    const developer = req.developer;

    const [apiKeys, usageStats] = await Promise.all([
      prisma.apiKey.findMany({
        where: { developerId: developer.id },
        select: {
          id: true,
          name: true,
          environment: true,
          isActive: true,
          createdAt: true,
          lastUsedAt: true,
          key: true,
        },
      }),
      prisma.apiUsage.aggregate({
        where: { developerId: developer.id },
        _count: { id: true },
        _sum: { cost: true },
      }),
    ]);

    return successResponse(res, {
      developer: {
        id: developer.id,
        email: developer.email,
        companyName: developer.companyName,
        phone: developer.phone,
        createdAt: developer.createdAt,
      },
      apiKeys,
      stats: {
        totalCalls: usageStats._count.id,
        totalSpent: usageStats._sum.cost || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/regenerate-key
 */
async function regenerateKey(req, res, next) {
  try {
    const { keyId, environment } = req.body;
    const developer = req.developer;

    const existingKey = await prisma.apiKey.findFirst({
      where: { id: keyId, developerId: developer.id },
    });

    if (!existingKey) {
      return errorResponse(res, 404, 'KEY_NOT_FOUND', 'API key not found.');
    }

    // Deactivate old key
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    // Generate new key
    const newKeyValue = generateApiKey(environment || existingKey.environment);
    const newKey = await prisma.apiKey.create({
      data: {
        developerId: developer.id,
        key: newKeyValue,
        name: existingKey.name,
        environment: environment || existingKey.environment,
      },
    });

    await logAudit(developer.id, 'API_KEY_REGENERATED', { oldKeyId: keyId, newKeyId: newKey.id }, newKey.id, req);

    return successResponse(res, {
      newApiKey: {
        id: newKey.id,
        key: newKeyValue,
        name: newKey.name,
        environment: newKey.environment,
        createdAt: newKey.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    // Always return success to prevent email enumeration
    const developer = await prisma.developer.findUnique({ where: { email } });

    if (developer && developer.isActive) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.developer.update({
        where: { id: developer.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpiry: expiry,
        },
      });

      // Send email (non-blocking)
      sendPasswordResetEmail(email, resetToken).catch((err) =>
        console.error('Password reset email failed:', err.message)
      );

      await logAudit(developer.id, 'PASSWORD_RESET_REQUESTED', { email }, null, req);
    }

    // Always return same response (prevent enumeration)
    return successResponse(res, {
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return errorResponse(res, 400, 'MISSING_FIELD', 'token and newPassword are required.');
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 400, 'WEAK_PASSWORD', 'Password must be at least 8 characters.');
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const developer = await prisma.developer.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: { gt: new Date() },
        isActive: true,
      },
    });

    if (!developer) {
      return errorResponse(res, 400, 'INVALID_RESET_TOKEN', 'Password reset token is invalid or has expired.');
    }

    // Hash new password and clear reset token
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.developer.update({
      where: { id: developer.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    await logAudit(developer.id, 'PASSWORD_RESET_COMPLETED', {}, null, req);

    return successResponse(res, {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const developer = req.developer;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 400, 'MISSING_FIELD', 'currentPassword and newPassword are required.');
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 400, 'WEAK_PASSWORD', 'New password must be at least 8 characters.');
    }

    // Fetch full developer record (req.developer doesn't include password)
    const fullDeveloper = await prisma.developer.findUnique({ where: { id: developer.id } });
    const passwordMatch = await bcrypt.compare(currentPassword, fullDeveloper.password);

    if (!passwordMatch) {
      return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Current password is incorrect.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.developer.update({
      where: { id: developer.id },
      data: { password: hashedPassword },
    });

    await logAudit(developer.id, 'PASSWORD_CHANGED', {}, null, req);

    return successResponse(res, { message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, getMe, regenerateKey, forgotPassword, resetPassword, changePassword };
