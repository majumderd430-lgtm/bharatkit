const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured — emails will be logged to console only');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();

  if (!t) {
    // Log to console in dev when SMTP not configured
    console.log(`\n📧 [EMAIL - not sent, SMTP unconfigured]\nTo: ${to}\nSubject: ${subject}\n${text || ''}\n`);
    return { messageId: 'console-only' };
  }

  const info = await t.sendMail({
    from: `"BharatKit" <${env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  });

  return info;
}

async function sendWelcomeEmail(email, companyName, sandboxKey, liveKey) {
  return sendEmail({
    to: email,
    subject: 'Welcome to BharatKit — Your API Keys',
    text: `Welcome to BharatKit, ${companyName}!\n\nSandbox Key: ${sandboxKey}\nProduction Key: ${liveKey}\n\nDocs: https://bharatkit.dev/docs`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
        <h1 style="color:#6366f1;margin-bottom:8px">⚡ BharatKit</h1>
        <h2 style="margin-bottom:24px">Welcome, ${companyName}!</h2>
        <p style="color:#94a3b8;margin-bottom:24px">Your developer account is ready. Here are your API keys:</p>
        
        <div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:16px">
          <div style="font-size:12px;color:#10b981;font-weight:600;margin-bottom:8px">🟢 SANDBOX KEY (Free)</div>
          <code style="font-size:13px;word-break:break-all;color:#e2e8f0">${sandboxKey}</code>
        </div>
        
        <div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:24px">
          <div style="font-size:12px;color:#f59e0b;font-weight:600;margin-bottom:8px">🔴 PRODUCTION KEY (Keep secret)</div>
          <code style="font-size:13px;word-break:break-all;color:#e2e8f0">${liveKey}</code>
        </div>
        
        <p style="color:#ef4444;font-size:13px;margin-bottom:24px">⚠️ Never share your production key publicly or commit it to version control.</p>
        
        <a href="https://bharatkit.dev/docs" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Documentation →</a>
        
        <p style="color:#475569;font-size:12px;margin-top:32px">BharatKit — India's Government Digital Rails API</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${env.FRONTEND_URL}/dashboard/reset-password?token=${resetToken}`;

  return sendEmail({
    to: email,
    subject: 'BharatKit — Reset Your Password',
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
        <h1 style="color:#6366f1;margin-bottom:8px">⚡ BharatKit</h1>
        <h2 style="margin-bottom:16px">Reset Your Password</h2>
        <p style="color:#94a3b8;margin-bottom:24px">We received a request to reset your password. Click the button below to set a new one.</p>
        
        <a href="${resetUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;margin-bottom:24px">
          Reset Password →
        </a>
        
        <p style="color:#64748b;font-size:13px;margin-bottom:8px">Or copy this link:</p>
        <code style="font-size:12px;color:#94a3b8;word-break:break-all">${resetUrl}</code>
        
        <p style="color:#ef4444;font-size:13px;margin-top:24px">⏰ This link expires in 1 hour.</p>
        <p style="color:#475569;font-size:12px;margin-top:16px">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendWelcomeEmail, sendPasswordResetEmail };
