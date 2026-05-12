require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const env = require('./config/env');
const { httpLogger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kyc');
const paymentsRoutes = require('./routes/payments');
const bankRoutes = require('./routes/bank');
const documentsRoutes = require('./routes/documents');
const businessRoutes = require('./routes/business');
const billingRoutes = require('./routes/billing');

const app = express();

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for API — enable for dashboard in production
  crossOriginEmbedderPolicy: false,
}));

// CORS
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature'],
}));

// Trust proxy (for correct IP behind nginx/load balancer)
app.set('trust proxy', 1);

// ============================================================
// IMPORTANT: Billing webhook MUST be registered BEFORE
// express.json() so it gets the raw body for signature verification
// ============================================================
app.use('/api/v1/billing/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/billing').webhookHandler
);

// Body parsing (after webhook raw route)
app.use(express.json({ limit: '10mb' })); // 10MB for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// HTTP logging
app.use(httpLogger);

// ============================================================
// Health Check
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ============================================================
// Sandbox Test Data
// ============================================================
app.get('/sandbox/test-data', (req, res) => {
  res.json({
    success: true,
    data: {
      aadhaar: '123456789012',
      aadhaarFormatted: '1234-5678-9012',
      pan: 'ABCDE1234F',
      upiId: 'test@sandbox',
      gstin: '27AAPFU0939F1ZV',
      testOtp: '123456',
      mobile: '9876543210',
      dob: '1990-05-15',
      name: 'Rahul Sharma',
      sampleSelfie: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/sandbox_selfie',
      sampleAadhaarPhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/sandbox_aadhaar_photo',
      sampleDrivingLicence: 'DL-TEST-001',
      notes: {
        aadhaar: 'Use OTP 123456 for sandbox Aadhaar verification',
        upi: 'Any UPI ID ending with @sandbox is valid in sandbox mode',
        gstin: 'Use this GSTIN for sandbox GST verification',
        pan: 'Any valid format PAN (ABCDE1234F) works in sandbox',
      },
    },
  });
});

// ============================================================
// API Routes
// ============================================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/bank', bankRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/billing', billingRoutes);

// ============================================================
// Serve React Dashboard (production)
// ============================================================
if (env.NODE_ENV === 'production') {
  app.use('/dashboard', express.static(path.join(__dirname, '../dashboard/dist')));
  app.get('/dashboard/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dashboard/dist/index.html'));
  });
  // Redirect root to dashboard
  app.get('/', (req, res) => res.redirect('/dashboard'));
}

// ============================================================
// 404 Handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found.`,
      docs: 'https://bharatkit.dev/docs',
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================
const PORT = env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`
  ██████╗ ██╗  ██╗ █████╗ ██████╗  █████╗ ████████╗██╗  ██╗██╗████████╗
  ██╔══██╗██║  ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██║ ██╔╝██║╚══██╔══╝
  ██████╔╝███████║███████║██████╔╝███████║   ██║   █████╔╝ ██║   ██║   
  ██╔══██╗██╔══██║██╔══██║██╔══██╗██╔══██║   ██║   ██╔═██╗ ██║   ██║   
  ██████╔╝██║  ██║██║  ██║██║  ██║██║  ██║   ██║   ██║  ██╗██║   ██║   
  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝   ╚═╝   

  🚀 BharatKit API Server running on port ${PORT}
  🌍 Environment: ${env.NODE_ENV}
  📖 Docs: https://bharatkit.dev/docs
  ❤️  India's Government Digital Rails API
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
