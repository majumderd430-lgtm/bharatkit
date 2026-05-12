require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'bharatkit-dev-secret-change-in-prod',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  UIDAI_API_URL: process.env.UIDAI_API_URL,
  UIDAI_API_KEY: process.env.UIDAI_API_KEY,
  GST_API_URL: process.env.GST_API_URL,
  GST_API_KEY: process.env.GST_API_KEY,
  DIGILOCKER_CLIENT_ID: process.env.DIGILOCKER_CLIENT_ID,
  DIGILOCKER_CLIENT_SECRET: process.env.DIGILOCKER_CLIENT_SECRET,
  ACCOUNT_AGGREGATOR_URL: process.env.ACCOUNT_AGGREGATOR_URL,
  ACCOUNT_AGGREGATOR_KEY: process.env.ACCOUNT_AGGREGATOR_KEY,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

module.exports = env;
