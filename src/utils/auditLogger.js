const prisma = require('../config/database');

/**
 * Log an audit event
 */
async function logAudit(developerId, action, metadata = {}, apiKeyId = null, req = null) {
  try {
    await prisma.auditLog.create({
      data: {
        developerId,
        apiKeyId,
        action,
        ipAddress: req ? req.ip || req.connection.remoteAddress : null,
        userAgent: req ? req.get('user-agent') : null,
        metadata: JSON.stringify(metadata),
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}

module.exports = { logAudit };
