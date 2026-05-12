#!/usr/bin/env node
/**
 * Generate secure secrets for production .env
 * Run: node scripts/generate-secrets.js
 */
const crypto = require('crypto');

console.log('\n🔐 BharatKit — Generated Secrets\n');
console.log('Copy these into your .env file:\n');
console.log(`JWT_SECRET="${crypto.randomBytes(32).toString('hex')}"`);
console.log(`\n# Add to your .env and keep these SECRET`);
console.log(`# Never commit these to version control`);
