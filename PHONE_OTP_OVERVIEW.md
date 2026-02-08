# Phone OTP Authentication Implementation

This document provides an overview of the Phone OTP Authentication system implemented for TopAffaireImmo.

## 📋 Overview

A complete **Phone-based One-Time Password (OTP) authentication system** using:
- **Vonage (Nexmo)** for SMS delivery
- **Express.js** backend API
- **MongoDB** for user storage
- **Redis** (optional) for OTP caching
- **JWT** for session management
- **React** frontend example

## 🗂️ Project Structure

```
topaffaireimmo/
├── backend/                    # Express API Server
│   ├── src/
│   │   ├── config/            # Configuration
│   │   ├── controllers/       # OTP request/verify logic
│   │   ├── middleware/        # Rate limiting & auth
│   │   ├── models/            # MongoDB models (User, OTPAttempt)
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Utilities (JWT, Vonage SMS, Redis)
│   │   └── server.ts          # Express server entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── README.md              # Detailed backend documentation
│   └── PHASE2_WHATSAPP.md     # WhatsApp OTP guide
│
├── frontend-example/           # React UI Example
│   ├── src/
│   │   ├── OTPAuth.tsx        # OTP authentication component
│   │   └── OTPAuth.css        # Styling
│   └── README.md
│
└── PHONE_OTP_OVERVIEW.md      # This file
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
# - VONAGE_API_KEY
# - VONAGE_API_SECRET
# - MONGODB_URI
# - JWT_SECRET

# Start server
npm run dev
```

Server runs on `http://localhost:3001`

### 2. Frontend Integration

Copy the example React component:

```bash
cp frontend-example/src/OTPAuth.tsx src/components/
cp frontend-example/src/OTPAuth.css src/components/
```

Use in your app:

```tsx
import { OTPAuth } from './components/OTPAuth';

function App() {
  return <OTPAuth />;
}
```

## 📡 API Endpoints

### POST `/auth/otp/request`
Request OTP code via SMS

**Request:**
```json
{
  "phone": "+2126XXXXXXXX"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### POST `/auth/otp/verify`
Verify OTP and get JWT token

**Request:**
```json
{
  "phone": "+2126XXXXXXXX",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "phone": "+2126XXXXXXXX",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔒 Security Features

✅ **OTP Security**
- 6-digit cryptographically secure random generation
- Bcrypt hashing before storage (never stored in plain text)
- 5-minute TTL (auto-expiry)
- One-time use (deleted after verification)
- Constant-time comparison to prevent timing attacks

✅ **Rate Limiting**
- Max 3 OTP requests per hour per phone+IP
- General API rate limiting (100 requests per 15 minutes per IP)

✅ **Brute Force Protection**
- Track failed verification attempts
- Lock account for 15 minutes after 5 failed attempts
- Generic error messages to prevent phone enumeration

✅ **Phone Validation**
- Morocco-specific validation (+212 country code)
- Format validation using libphonenumber-js
- E.164 format normalization

✅ **JWT Security**
- Secure token generation
- Configurable expiration (default: 7 days)
- Token-based session management

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌──────────────────┐
│  Express Server  │
│  (Backend API)   │
└─────┬────────┬───┘
      │        │
      ↓        ↓
┌─────────┐ ┌────────┐
│ MongoDB │ │ Redis  │  (OTP Storage)
└─────────┘ └────────┘
      │
      ↓
┌─────────────┐
│   Vonage    │  (SMS Delivery)
│   SMS API   │
└─────────────┘
```

## 📚 Documentation

- **[Backend README](backend/README.md)** - Complete backend setup and API documentation
- **[Phase 2: WhatsApp OTP](backend/PHASE2_WHATSAPP.md)** - Guide to implement WhatsApp OTP
- **[Frontend Example](frontend-example/README.md)** - React component usage

## 🔧 Configuration

### Required Environment Variables

**Backend (.env)**:
```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/topaffaireimmo
REDIS_URL=redis://localhost:6379  # Optional

# Vonage
VONAGE_API_KEY=your_key_here
VONAGE_API_SECRET=your_secret_here

# Security
JWT_SECRET=your_secure_secret_here

# OTP Settings
OTP_LENGTH=6
OTP_TTL_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_LOCKOUT_MINUTES=15

# Rate Limiting
RATE_LIMIT_WINDOW_MINUTES=60
RATE_LIMIT_MAX_REQUESTS=3

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Getting Vonage Credentials

1. Sign up at [Vonage Dashboard](https://dashboard.nexmo.com/)
2. Navigate to "API Settings"
3. Copy your API Key and API Secret
4. Add credits to your account for SMS sending

## 🧪 Testing

### Manual Testing with curl

**1. Request OTP:**
```bash
curl -X POST http://localhost:3001/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2126XXXXXXXX"}'
```

**2. Verify OTP:**
```bash
curl -X POST http://localhost:3001/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2126XXXXXXXX", "code": "123456"}'
```

**3. Use JWT Token:**
```bash
curl http://localhost:3001/protected-route \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB URI (MongoDB Atlas)
- [ ] Configure Redis for OTP storage
- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Enable HTTPS (via reverse proxy)
- [ ] Set production `CORS_ORIGIN`
- [ ] Set up monitoring (logs, errors, metrics)
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Test rate limiting under load
- [ ] Monitor Vonage SMS delivery rates

### Deployment Options

**Option 1: VPS/EC2**
```bash
npm run build
pm2 start dist/server.js --name topaffaire-api
```

**Option 2: Docker**
```bash
docker build -t topaffaire-api .
docker run -p 3001:3001 topaffaire-api
```

**Option 3: Vercel/Netlify Functions**
- May require serverless adapter

## 📊 Monitoring & Metrics

Track these key metrics:

- **OTP Delivery Rate**: Target >98%
- **SMS Cost**: Monitor per-message costs
- **Verification Success Rate**: Target >90%
- **Failed Attempt Rate**: Watch for attacks
- **Rate Limit Hits**: Adjust if legitimate users affected
- **Average Verification Time**: Target <30 seconds

## 🔄 Phase 2: WhatsApp OTP

After successful SMS OTP implementation, you can upgrade to WhatsApp:

**Benefits:**
- 60-80% cost reduction
- Higher open rates (98% vs 90%)
- Better user experience
- Two-way communication

**See:** [PHASE2_WHATSAPP.md](backend/PHASE2_WHATSAPP.md) for implementation guide

## 🐛 Troubleshooting

### OTP not received
- Check Vonage dashboard for delivery status
- Verify phone number format
- Check Vonage account balance
- Verify API credentials in .env

### Rate limiting too strict
- Adjust `RATE_LIMIT_MAX_REQUESTS` in .env
- In development: set `SKIP_RATE_LIMIT=true`

### MongoDB connection issues
- Ensure MongoDB is running: `mongod`
- Check connection string format
- For MongoDB Atlas: whitelist IP addresses

### Redis not available
- Server falls back to MongoDB automatically
- For production: install Redis for better performance

### JWT token expired
- Default expiration is 7 days
- Adjust `JWT_EXPIRES_IN` in .env
- Implement token refresh logic in frontend

## 📖 Additional Resources

- [Vonage SMS API Docs](https://developer.vonage.com/messaging/sms/overview)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security/)

## 🎯 Success Criteria

✅ **Functional Requirements**
- [x] Generate 6-digit OTP securely
- [x] Send OTP via Vonage SMS
- [x] Verify OTP with constant-time comparison
- [x] Create user account on first login
- [x] Return JWT token on successful verification
- [x] Rate limit OTP requests (3/hour per phone+IP)
- [x] Lock account after 5 failed attempts (15 minutes)

✅ **Security Requirements**
- [x] Hash OTP before storage (bcrypt)
- [x] Delete OTP after verification (prevent replay)
- [x] Validate Morocco phone numbers (+212)
- [x] Generic error messages (prevent enumeration)
- [x] Environment variables for secrets
- [x] HTTPS support (via reverse proxy)

✅ **Code Quality**
- [x] TypeScript for type safety
- [x] Modular architecture
- [x] Error handling
- [x] Comprehensive documentation
- [x] Production-ready configuration

## 📝 License

Private - All rights reserved

---

**Need Help?**

- Backend API: See [backend/README.md](backend/README.md)
- WhatsApp OTP: See [backend/PHASE2_WHATSAPP.md](backend/PHASE2_WHATSAPP.md)
- Frontend: See [frontend-example/README.md](frontend-example/README.md)
