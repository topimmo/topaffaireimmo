# TopAffaireImmo Backend - Phone OTP Authentication

Backend API service for TopAffaireImmo providing secure phone-based OTP authentication using Vonage (Nexmo).

## 🚀 Features

- **Phone OTP Authentication**: Secure OTP-based login via SMS
- **Vonage SMS Integration**: Reliable SMS delivery using Vonage API
- **Security-First Design**:
  - OTP hashing with bcrypt before storage
  - Constant-time OTP comparison to prevent timing attacks
  - Rate limiting (3 requests per hour per phone+IP)
  - Failed attempt tracking (lock after 5 failures for 15 minutes)
  - Generic error messages to prevent phone enumeration
  - Morocco phone number validation (+212)
- **Flexible Storage**: Redis (recommended) or MongoDB for OTP storage
- **JWT Authentication**: Secure session tokens
- **Auto-cleanup**: TTL-based OTP expiration (5 minutes)

## 📋 Prerequisites

- Node.js 18+ (matches parent project)
- MongoDB (local or cloud)
- Redis (optional, recommended for production)
- Vonage account with API credentials

## 🛠️ Installation

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Configure Vonage**:
   - Sign up at [Vonage Dashboard](https://dashboard.nexmo.com/)
   - Get your API Key and Secret
   - Add them to `.env`

4. **Set up MongoDB**:
   - Local: `mongod` (default: mongodb://localhost:27017)
   - Or use MongoDB Atlas for cloud hosting

5. **Set up Redis** (optional but recommended):
   - Local: `redis-server` (default: redis://localhost:6379)
   - Or use Redis Cloud / AWS ElastiCache

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## 📡 API Endpoints

### 1. Request OTP

**Endpoint**: `POST /auth/otp/request`

**Request Body**:
```json
{
  "phone": "+2126XXXXXXXX"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "Error message"
}
```

**Rate Limiting**: Max 3 requests per hour per phone+IP combination.

**Security Features**:
- Validates Morocco phone numbers (+212 country code)
- Generates 6-digit cryptographically secure OTP
- Hashes OTP with bcrypt before storage
- Sets 5-minute TTL
- Sends SMS via Vonage
- Does NOT return OTP in response

---

### 2. Verify OTP

**Endpoint**: `POST /auth/otp/verify`

**Request Body**:
```json
{
  "phone": "+2126XXXXXXXX",
  "code": "123456"
}
```

**Response** (Success):
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

**Response** (Error):
```json
{
  "success": false,
  "error": "Invalid verification code"
}
```

**Security Features**:
- Constant-time comparison (bcrypt.compare)
- Tracks failed attempts (max 5)
- Locks account for 15 minutes after 5 failed attempts
- Deletes OTP after successful verification (prevents replay)
- Creates user account if doesn't exist
- Returns JWT token for authenticated session

---

### 3. Health Check

**Endpoint**: `GET /health`

**Response**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔒 Using JWT for Protected Routes

After successful OTP verification, use the returned JWT token in subsequent requests:

**Header**:
```
Authorization: Bearer <token>
```

**Example** (using fetch):
```javascript
const response = await fetch('http://localhost:3001/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── index.ts           # Configuration management
│   ├── controllers/
│   │   └── otpController.ts   # OTP request/verify logic
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication middleware
│   │   └── rateLimiter.ts     # Rate limiting
│   ├── models/
│   │   ├── User.ts            # User model
│   │   └── OTPAttempt.ts      # OTP storage model
│   ├── routes/
│   │   └── auth.ts            # Auth routes
│   ├── utils/
│   │   ├── jwt.ts             # JWT utilities
│   │   ├── phoneValidator.ts  # Phone validation & OTP generation
│   │   ├── redisStorage.ts    # Redis OTP storage
│   │   └── vonageSMS.ts       # Vonage SMS sender
│   └── server.ts              # Express server
├── .env.example               # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

All configuration is managed via environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/topaffaireimmo |
| `REDIS_URL` | Redis connection string (optional) | - |
| `VONAGE_API_KEY` | Vonage API key | (required) |
| `VONAGE_API_SECRET` | Vonage API secret | (required) |
| `JWT_SECRET` | Secret for signing JWTs | (required) |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `OTP_LENGTH` | OTP digit length | 6 |
| `OTP_TTL_MINUTES` | OTP validity duration | 5 |
| `OTP_MAX_ATTEMPTS` | Max failed verification attempts | 5 |
| `OTP_LOCKOUT_MINUTES` | Lockout duration after max attempts | 15 |
| `RATE_LIMIT_MAX_REQUESTS` | Max OTP requests per window | 3 |
| `RATE_LIMIT_WINDOW_MINUTES` | Rate limit window | 60 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |
| `ALLOWED_COUNTRY_CODE` | Allowed phone country code | +212 |

## 🧪 Testing the API

### Using curl

**Request OTP**:
```bash
curl -X POST http://localhost:3001/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2126XXXXXXXX"}'
```

**Verify OTP**:
```bash
curl -X POST http://localhost:3001/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2126XXXXXXXX", "code": "123456"}'
```

### Using Postman

1. Create a POST request to `http://localhost:3001/auth/otp/request`
2. Set Content-Type: `application/json`
3. Body (raw JSON): `{"phone": "+2126XXXXXXXX"}`
4. Send request
5. Check your phone for OTP
6. Create a POST request to `http://localhost:3001/auth/otp/verify`
7. Body: `{"phone": "+2126XXXXXXXX", "code": "123456"}`
8. Save the returned token for authenticated requests

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **Enable Redis in production** - Better performance and security for OTP storage
4. **Use HTTPS in production** - Protect data in transit
5. **Monitor rate limits** - Adjust based on legitimate usage patterns
6. **Rotate Vonage credentials** - Regularly update API keys
7. **Set up logging** - Monitor failed attempts and suspicious activity

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in environment
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Configure production MongoDB URI (MongoDB Atlas recommended)
- [ ] Configure Redis (AWS ElastiCache, Redis Cloud, etc.)
- [ ] Set production `CORS_ORIGIN` (your frontend domain)
- [ ] Enable HTTPS (via reverse proxy like Nginx)
- [ ] Set up monitoring and logging (e.g., PM2, Winston)
- [ ] Configure firewall rules
- [ ] Set up automated backups for MongoDB

### Deployment Options

**Option 1: Traditional Server** (VPS, EC2, etc.)
```bash
# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name topaffaire-api

# Or use systemd
```

**Option 2: Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

**Option 3: Serverless** (AWS Lambda, Google Cloud Functions)
- May require adapting Express to serverless handler
- Not ideal for WebSocket connections

## 📚 Integration with Frontend

See `/frontend-example` folder for React integration examples (to be created).

Basic integration:

```typescript
// Request OTP
const requestOTP = async (phone: string) => {
  const response = await fetch('http://localhost:3001/auth/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return response.json();
};

// Verify OTP
const verifyOTP = async (phone: string, code: string) => {
  const response = await fetch('http://localhost:3001/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code })
  });
  const data = await response.json();
  
  if (data.success) {
    // Store token
    localStorage.setItem('authToken', data.token);
    // Store user
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
};
```

## 🔄 Phase 2: WhatsApp OTP

See [PHASE2_WHATSAPP.md](./PHASE2_WHATSAPP.md) for details on implementing WhatsApp OTP using Vonage Messages API.

## 📖 Additional Resources

- [Vonage SMS API Documentation](https://developer.vonage.com/messaging/sms/overview)
- [Vonage Messages API (WhatsApp)](https://developer.vonage.com/messages/overview)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## 🐛 Troubleshooting

### OTP not received
- Check Vonage dashboard for delivery status
- Verify phone number format (+212...)
- Check Vonage account balance
- Verify API credentials

### MongoDB connection issues
- Ensure MongoDB is running
- Check connection string
- Verify network access (for MongoDB Atlas, whitelist IP)

### Redis connection issues
- Ensure Redis server is running
- Check Redis URL format
- Server will fallback to MongoDB if Redis unavailable

### Rate limiting too strict
- Adjust `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MINUTES`
- In development, set `SKIP_RATE_LIMIT=true`

## 📝 License

Private - All rights reserved
