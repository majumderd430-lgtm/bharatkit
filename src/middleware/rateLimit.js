const { errorResponse } = require('../utils/responseFormatter');

// Try to use Redis if available, fall back to in-memory
let redisClient = null;

async function getRedisClient() {
  if (redisClient) return redisClient;
  try {
    const Redis = require('ioredis');
    const client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
    });
    await client.connect();
    await client.ping();
    redisClient = client;
    console.log('✅ Redis connected for rate limiting');
    return redisClient;
  } catch (err) {
    console.warn('⚠️  Redis unavailable, using in-memory rate limiting:', err.message);
    return null;
  }
}

// In-memory fallback store
const memoryStore = new Map();

// Clean up memory store every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of memoryStore.entries()) {
    if (data.resetAt < now) memoryStore.delete(key);
  }
}, 10 * 60 * 1000);

async function checkRateLimitRedis(client, keyId, limit, windowMs) {
  const redisKey = `ratelimit:${keyId}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Use Redis sorted set: score = timestamp, member = unique call id
  const pipeline = client.pipeline();
  pipeline.zremrangebyscore(redisKey, '-inf', windowStart);
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
  pipeline.zcard(redisKey);
  pipeline.pexpire(redisKey, windowMs);
  const results = await pipeline.exec();

  const count = results[2][1]; // zcard result
  return { count, resetAt: now + windowMs };
}

function checkRateLimitMemory(keyId, limit, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!memoryStore.has(keyId)) {
    memoryStore.set(keyId, { calls: [], resetAt: now + windowMs });
  }

  const data = memoryStore.get(keyId);
  // Remove old calls outside window
  data.calls = data.calls.filter((ts) => ts > windowStart);
  data.calls.push(now);
  data.resetAt = now + windowMs;

  return { count: data.calls.length, resetAt: data.resetAt };
}

/**
 * Rate limiter middleware per API key
 * Sandbox: 100 calls/hour
 * Production: 10,000 calls/hour
 */
async function rateLimiter(req, res, next) {
  if (!req.apiKey) return next();

  const keyId = req.apiKey.id;
  const environment = req.environment;
  const limit = environment === 'production' ? 10000 : 100;
  const windowMs = 60 * 60 * 1000; // 1 hour

  try {
    let count, resetAt;

    const redis = await getRedisClient();
    if (redis) {
      ({ count, resetAt } = await checkRateLimitRedis(redis, keyId, limit, windowMs));
    } else {
      ({ count, resetAt } = checkRateLimitMemory(keyId, limit, windowMs));
    }

    const remaining = Math.max(0, limit - count);
    const resetInSeconds = Math.ceil((resetAt - Date.now()) / 1000);

    res.set({
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': remaining,
      'X-RateLimit-Reset': new Date(resetAt).toISOString(),
    });

    if (count > limit) {
      res.set('Retry-After', resetInSeconds);
      return errorResponse(
        res, 429, 'RATE_LIMIT_EXCEEDED',
        `Rate limit exceeded. ${limit} calls/hour allowed for ${environment} keys. ` +
        `Resets in ${resetInSeconds} seconds at ${new Date(resetAt).toISOString()}.`
      );
    }

    next();
  } catch (err) {
    console.error('Rate limiter error:', err);
    // Fail open — don't block requests if rate limiter breaks
    next();
  }
}

module.exports = rateLimiter;
