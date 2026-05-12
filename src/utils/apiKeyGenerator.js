const crypto = require('crypto');

/**
 * Generate a secure API key with environment prefix
 * @param {string} environment - 'sandbox' or 'production'
 * @returns {string} API key
 */
function generateApiKey(environment) {
  const prefix = environment === 'production' ? 'bk_live_' : 'bk_sandbox_';
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `${prefix}${randomBytes}`;
}

/**
 * Detect environment from API key prefix
 * @param {string} key
 * @returns {string} 'sandbox' | 'production'
 */
function getEnvironmentFromKey(key) {
  if (key.startsWith('bk_live_')) return 'production';
  if (key.startsWith('bk_sandbox_')) return 'sandbox';
  return null;
}

module.exports = { generateApiKey, getEnvironmentFromKey };
