# 🇮🇳 BharatKit

**Stripe-like infrastructure API for India's government digital rails**

BharatKit provides a unified, developer-friendly API platform to access India's digital public infrastructure including Aadhaar KYC, UPI payments, bank statements, DigiLocker documents, and GST verification.

---

## 🚀 Features

### 1. **KYC API** — Identity Verification
- ✅ Aadhaar verification with OTP
- ✅ PAN card verification
- ✅ Face matching (selfie vs Aadhaar photo)
- ✅ Full KYC bundle with risk scoring

### 2. **UPI Payments API** — Digital Payments
- ✅ Send UPI payments
- ✅ Verify UPI IDs
- ✅ Transaction status tracking
- ✅ Refund initiation

### 3. **Bank Statement API** — Financial Data
- ✅ Account Aggregator consent flow
- ✅ Fetch bank statements (1-24 months)
- ✅ Automatic transaction analysis
- ✅ Credit score estimation

### 4. **Document Verification API** — DigiLocker Integration
- ✅ Driving licence verification
- ✅ Vehicle RC verification
- ✅ Degree certificates
- ✅ Voter ID, Passport

### 5. **GST Business API** — Business Verification
- ✅ GSTIN verification
- ✅ Business PAN verification
- ✅ Full business check with risk assessment

---

## 📦 Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT tokens for dashboard, API keys for developers
- **Payments**: Razorpay for billing
- **Email**: Nodemailer
- **Frontend**: React + Vite
- **Deployment**: Docker + Docker Compose

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- (Optional) Docker & Docker Compose

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/bharatkit.git
cd bharatkit
npm install
cd dashboard && npm install && cd ..
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required variables:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bharatkit"
JWT_SECRET="your-super-secret-jwt-key"
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 4. Run Development Server

```bash
# Terminal 1: Backend API
npm run dev

# Terminal 2: Frontend Dashboard
cd dashboard
npm run dev
```

- **API**: http://localhost:3000
- **Dashboard**: http://localhost:5173/dashboard
- **Health Check**: http://localhost:3000/health

---

## 🐳 Docker Deployment

### Build and Run

```bash
# Start PostgreSQL + API
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down
```

The API will be available at `http://localhost:3000`

---

## 📖 API Quick Reference

### Authentication

All API requests require an API key:

```bash
curl -X POST https://api.bharatkit.dev/api/v1/kyc/pan \
  -H "Authorization: Bearer bk_sandbox_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"panNumber": "ABCDE1234F", "name": "Rahul Sharma", "dob": "1990-05-15"}'
```

### Sandbox vs Production

- **Sandbox keys** (`bk_sandbox_*`): Free, returns mock data, 100 calls/hour
- **Production keys** (`bk_live_*`): Paid, real government APIs, 10,000 calls/hour

### Sandbox Test Data

```bash
GET /sandbox/test-data
```

Returns:
```json
{
  "aadhaar": "123456789012",
  "pan": "ABCDE1234F",
  "upiId": "test@sandbox",
  "gstin": "27AAPFU0939F1ZV",
  "testOtp": "123456"
}
```

### Example: Verify PAN

```bash
curl -X POST http://localhost:3000/api/v1/kyc/pan \
  -H "Authorization: Bearer bk_sandbox_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "panNumber": "ABCDE1234F",
    "name": "Rahul Sharma",
    "dob": "1990-05-15"
  }'
```

Response:
```json
{
  "success": true,
  "requestId": "req_8f3d92a1",
  "data": {
    "verified": true,
    "nameMatch": true,
    "dobMatch": true,
    "panStatus": "ACTIVE",
    "linkedToAadhaar": true
  }
}
```

---

## 💰 Pricing

| Service | Endpoint | Cost |
|---------|----------|------|
| Aadhaar OTP | `/kyc/aadhaar/send-otp` | Free |
| Aadhaar Verify | `/kyc/aadhaar` | ₹2 |
| PAN Verify | `/kyc/pan` | ₹1 |
| Face Match | `/kyc/face-match` | ₹3 |
| Full KYC | `/kyc/full` | ₹8 |
| UPI Verify ID | `/payments/upi/verify-id` | ₹0.50 |
| UPI Send | `/payments/upi/send` | 0.1% of amount |
| Bank Consent | `/bank/request-consent` | ₹2 |
| Bank Statement | `/bank/fetch-statement` | ₹5 |
| Document Request | `/documents/request-access` | ₹1 |
| Document Verify | `/documents/verify` | ₹1 |
| GST Verify | `/business/verify-gst` | ₹1 |
| Business Full Check | `/business/full-check` | ₹2.50 |

**Sandbox mode is always free!**

---

## 🔐 Security

- API keys are hashed and stored securely
- Rate limiting: 100 calls/hour (sandbox), 10,000 calls/hour (production)
- All requests logged with audit trail
- HTTPS required in production
- Helmet.js security headers
- Input validation on all endpoints

---

## 📊 Developer Dashboard

Access at `/dashboard`:

1. **Dashboard**: Overview of API usage, costs, success rates
2. **API Keys**: Manage sandbox and production keys
3. **Usage**: Detailed analytics and call history
4. **Billing**: Current bill, payment, invoice history
5. **Docs**: Interactive API documentation

---

## 🧪 Testing

### Register a Developer Account

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "password": "password123",
    "companyName": "Test Corp",
    "phone": "9876543210"
  }'
```

You'll receive sandbox and production API keys via email.

### Make Your First API Call

```bash
# Get sandbox test data
curl http://localhost:3000/sandbox/test-data

# Verify PAN (sandbox)
curl -X POST http://localhost:3000/api/v1/kyc/pan \
  -H "Authorization: Bearer YOUR_SANDBOX_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "panNumber": "ABCDE1234F",
    "name": "Rahul Sharma",
    "dob": "1990-05-15"
  }'
```

---

## 📁 Project Structure

```
bharatkit/
├── src/
│   ├── server.js              # Express app entry point
│   ├── config/                # Database, env config
│   ├── middleware/            # Auth, rate limiting, logging
│   ├── routes/                # API route definitions
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic (Aadhaar, PAN, etc.)
│   ├── models/                # Prisma schema
│   └── utils/                 # Helpers (API key gen, response formatter)
├── dashboard/                 # React frontend
│   ├── src/
│   │   ├── pages/             # Dashboard pages
│   │   └── components/        # Reusable components
│   └── package.json
├── prisma/
│   └── schema.prisma          # Database schema
├── Dockerfile                 # Production Docker image
├── docker-compose.yml         # Local development stack
├── package.json
└── README.md
```

---

## 🌐 Deployment

### Deploy to Production

1. **Set up PostgreSQL database** (AWS RDS, DigitalOcean, etc.)

2. **Set environment variables**:
   ```env
   NODE_ENV=production
   DATABASE_URL=your_production_db_url
   JWT_SECRET=strong_random_secret
   RAZORPAY_KEY_ID=rzp_live_xxx
   RAZORPAY_KEY_SECRET=your_live_secret
   ```

3. **Build and deploy**:
   ```bash
   # Build dashboard
   cd dashboard && npm run build && cd ..
   
   # Run migrations
   npm run db:migrate
   
   # Start server
   npm start
   ```

4. **Or use Docker**:
   ```bash
   docker build -t bharatkit .
   docker run -p 3000:3000 --env-file .env bharatkit
   ```

### Deploy to Cloud Platforms

- **AWS**: ECS + RDS
- **DigitalOcean**: App Platform + Managed PostgreSQL
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **Render**: Connect GitHub repo

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

Built with ❤️ for India's developer ecosystem.

Powered by:
- UIDAI (Aadhaar)
- NPCI (UPI)
- Account Aggregator Network
- DigiLocker
- GST Network

---

## 📞 Support

- **Documentation**: https://bharatkit.dev/docs
- **Email**: support@bharatkit.dev
- **GitHub Issues**: https://github.com/yourusername/bharatkit/issues

---

**Made in India 🇮🇳 | Built for India's Digital Future**
