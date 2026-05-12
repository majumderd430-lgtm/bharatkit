/**
 * Simple in-memory retry queue for API usage logging.
 * Retries failed DB writes up to 3 times with exponential backoff.
 * In production, replace with a proper queue (Bull, BullMQ, SQS).
 */

const queue = [];
let processing = false;

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;

  while (queue.length > 0) {
    const item = queue[0];

    try {
      const prisma = require('../config/database');
      await prisma.apiUsage.create({ data: item.data });
      queue.shift(); // Remove on success
    } catch (err) {
      item.attempts = (item.attempts || 0) + 1;

      if (item.attempts >= 3) {
        console.error(`Usage log permanently failed after 3 attempts:`, err.message, item.data);
        queue.shift(); // Give up after 3 attempts
      } else {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, item.attempts - 1) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  processing = false;
}

function enqueueUsageLog(data) {
  queue.push({ data, attempts: 0 });
  // Process asynchronously
  setImmediate(processQueue);
}

module.exports = { enqueueUsageLog };
