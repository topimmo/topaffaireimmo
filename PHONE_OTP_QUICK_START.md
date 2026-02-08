# Phone OTP Authentication - Quick Start Guide

## 🚀 5-Minute Setup

This guide will get your Phone OTP Authentication running in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- MongoDB running (local or cloud)
- Vonage account with API credentials

## Step 1: Get Vonage Credentials (2 min)

1. Go to [Vonage Dashboard](https://dashboard.nexmo.com/)
2. Sign up or log in
3. Navigate to **API Settings**
4. Copy your **API Key** and **API Secret**
5. Add credits to your account (minimum €10 recommended)

## Step 2: Backend Setup (2 min)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your credentials
# Minimum required:
# - VONAGE_API_KEY=your_key_here
# - VONAGE_API_SECRET=your_secret_here
# - MONGODB_URI=mongodb://localhost:27017/topaffaireimmo
# - JWT_SECRET=your_secure_secret_minimum_32_characters

# Start the server
npm run dev
```

**Expected output:**
```
✅ MongoDB connected
🚀 Server running on port 3001
📍 Environment: development
🔗 CORS enabled for: http://localhost:5173
⚠️  Using MongoDB for OTP storage (Redis not configured)
```

## Step 3: Test with curl (1 min)

### Request OTP
```bash
curl -X POST http://localhost:3001/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2126XXXXXXXX"}'
```

Replace `+2126XXXXXXXX` with your Morocco phone number.

**Expected response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Check your phone** - you should receive an SMS with a 6-digit code.

### Verify OTP
```bash
curl -X POST http://localhost:3001/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2126XXXXXXXX", "code": "123456"}'
```

Replace `123456` with the code you received.

**Expected response:**
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

🎉 **Success!** You now have a working Phone OTP Authentication system.

## Step 4: Frontend Integration (Optional)

Copy the example React component to your app:

```bash
# From project root
cp frontend-example/src/OTPAuth.tsx src/components/
cp frontend-example/src/OTPAuth.css src/components/
```

Use in your app:

```tsx
import { OTPAuth } from './components/OTPAuth';

function LoginPage() {
  return <OTPAuth />;
}
```

## 🔧 Common Issues

### "MongoDB connection error"
**Solution:** Make sure MongoDB is running
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod
# or on macOS with Homebrew:
brew services start mongodb-community
```

### "Failed to send OTP"
**Solutions:**
1. Check Vonage credentials in `.env`
2. Verify Vonage account has credits
3. Check phone number format (+212XXXXXXXXX)
4. Check Vonage dashboard for error messages

### "Invalid phone number"
**Solution:** Ensure phone starts with `+212` (Morocco country code)

### Rate limit error
**Solution:** Wait 1 hour, or set `SKIP_RATE_LIMIT=true` in `.env` for development

## 📊 What's Next?

1. **Add Redis** (optional, for better performance):
   ```bash
   # Install Redis
   brew install redis  # macOS
   # or
   sudo apt-get install redis  # Ubuntu

   # Add to .env
   REDIS_URL=redis://localhost:6379
   ```

2. **Production Setup:**
   - Use MongoDB Atlas for database
   - Deploy to cloud (VPS, AWS, etc.)
   - Enable HTTPS
   - Set strong JWT_SECRET

3. **Integration:**
   - Add to your authentication flow
   - Implement protected routes
   - Add user profile features

## 📚 Full Documentation

- [PHONE_OTP_OVERVIEW.md](PHONE_OTP_OVERVIEW.md) - Complete overview
- [backend/README.md](backend/README.md) - Detailed backend docs
- [PHONE_OTP_IMPLEMENTATION_SUMMARY.md](PHONE_OTP_IMPLEMENTATION_SUMMARY.md) - Implementation details

## 🆘 Need Help?

Check the troubleshooting sections in:
- [backend/README.md](backend/README.md#-troubleshooting)
- [PHONE_OTP_OVERVIEW.md](PHONE_OTP_OVERVIEW.md#-troubleshooting)

---

**Total Time:** ~5 minutes ⏱️

**Status:** ✅ SMS OTP ONLY (no WhatsApp code)
