# SMS OTP Authentication Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICE                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              OTPLogin Component (React)                  │  │
│  │                                                          │  │
│  │  [Phone Input] → [Request OTP] → [Code Input] → [Verify]│  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                    ↓                  │
└─────────────────────────┼────────────────────┼──────────────────┘
                          │                    │
                          ↓                    ↓
                    POST /api/otp/request  POST /api/otp/verify
                          │                    │
┌─────────────────────────┼────────────────────┼──────────────────┐
│                  VERCEL SERVERLESS FUNCTIONS                    │
│                                                                 │
│  ┌────────────────────┐              ┌──────────────────────┐  │
│  │  request.ts        │              │  verify.ts           │  │
│  │                    │              │                      │  │
│  │ • Validate phone   │              │ • Validate code      │  │
│  │ • Check rate limit │              │ • Check lockout      │  │
│  │ • Generate OTP     │              │ • Compare hash       │  │
│  │ • Hash with bcrypt │              │ • Increment attempts │  │
│  │ • Store in DB      │              │ • Issue JWT token    │  │
│  │ • Send via Vonage  │              │ • Delete OTP record  │  │
│  └────────────────────┘              └──────────────────────┘  │
│           ↓                                    ↓                │
└───────────┼────────────────────────────────────┼────────────────┘
            │                                    │
            ↓                                    ↓
    ┌───────────────┐                    ┌─────────────┐
    │  Vonage SMS   │                    │ Supabase DB │
    │    API        │                    │  (Delete)   │
    └───────────────┘                    └─────────────┘
            │
            ↓
    ┌───────────────┐
    │ User's Phone  │
    │  SMS: 123456  │
    └───────────────┘
```

## Request OTP Flow

```
User                     API Route              Supabase           Vonage
  │                         │                       │                │
  │─────Phone Number───────>│                       │                │
  │                         │                       │                │
  │                         │─Check Rate Limit─────>│                │
  │                         │<─────Count────────────│                │
  │                         │                       │                │
  │                         │─Generate OTP──────────│                │
  │                         │  (crypto.randomInt)   │                │
  │                         │                       │                │
  │                         │─Hash OTP (bcrypt)─────│                │
  │                         │                       │                │
  │                         │─Store OTP─────────────>│                │
  │                         │  (phone, hash, exp)   │                │
  │                         │<────Success───────────│                │
  │                         │                       │                │
  │                         │─────Send SMS──────────┼───────────────>│
  │                         │   (plain OTP)         │                │
  │                         │<────Success───────────┼────────────────│
  │                         │                       │                │
  │<────Success (200)───────│                       │                │
  │                         │                       │                │
  │                    ┌────┴────┐                  │                │
  │                    │ SMS: 123456                                 │
  │<───────────────────┤         │                  │                │
                       └─────────┘                  │                │
```

## Verify OTP Flow

```
User                     API Route              Supabase           JWT
  │                         │                       │                │
  │─Phone + OTP Code───────>│                       │                │
  │                         │                       │                │
  │                         │─Load OTP Record───────>│                │
  │                         │<─phone, hash, exp─────│                │
  │                         │                       │                │
  │                         │─Check Locked?─────────│                │
  │                         │─Check Expired?────────│                │
  │                         │                       │                │
  │                         │─Compare Hash──────────│                │
  │                         │  bcrypt.compare()     │                │
  │                         │                       │                │
  │                    ┌────┴────┐                  │                │
  │                    │ Valid?  │                  │                │
  │                    └────┬────┘                  │                │
  │                         │                       │                │
  │                    YES  │  NO                   │                │
  │                    ┌────┴────┐                  │                │
  │                    │         │                  │                │
  │              Delete Record  Increment           │                │
  │                    │         │ Attempts         │                │
  │                    │         │                  │                │
  │                    │         └─Update───────────>│                │
  │                    │           (attempts++)     │                │
  │                    │                            │                │
  │                    │─Sign JWT Token─────────────┼───────────────>│
  │                    │<────Token──────────────────┼────────────────│
  │                    │                            │                │
  │<─Success + Token───│                            │                │
  │                    │                            │                │
  │─Store in localStorage                           │                │
  │                    │                            │                │
```

## Security Mechanisms

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: PHONE VALIDATION                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Morocco only (+212)                                     │  │
│  │ • Multiple format support                                │  │
│  │ • Normalize to E.164                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 2: RATE LIMITING                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Max 3 OTP requests per phone per hour                  │  │
│  │ • Tracked in database                                    │  │
│  │ • Returns 429 when exceeded                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 3: OTP SECURITY                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Cryptographically secure generation (crypto.randomInt) │  │
│  │ • Bcrypt hashing (salt rounds: 10)                       │  │
│  │ • Never stored in plain text                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 4: EXPIRATION                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • OTP valid for 5 minutes only                           │  │
│  │ • Automatic cleanup on verify                            │  │
│  │ • Prevents replay attacks                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 5: LOCKOUT MECHANISM                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • 5 failed attempts = 15 min lockout                     │  │
│  │ • Prevents brute force                                   │  │
│  │ • Automatic unlock after timeout                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 6: JWT TOKEN                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • HS256 algorithm                                        │  │
│  │ • Signed with secret key                                 │  │
│  │ • 7-day expiration                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 7: SERVER-SIDE SECRETS                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Service role key never exposed                         │  │
│  │ • JWT secret server-only                                 │  │
│  │ • Vonage credentials server-only                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Database State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    OTP ATTEMPTS TABLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INITIAL STATE: No record                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ phone: null                                               │  │
│  │ otp_hash: null                                            │  │
│  │ attempts: 0                                               │  │
│  │ locked_until: null                                        │  │
│  │ expires_at: null                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          │ Request OTP                          │
│                          ↓                                      │
│  OTP REQUESTED: Active record                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ phone: +212664352280                                      │  │
│  │ otp_hash: $2a$10$abcd...                                  │  │
│  │ attempts: 0                                               │  │
│  │ locked_until: null                                        │  │
│  │ expires_at: now() + 5 minutes                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                    ┌─────┴─────┐                                │
│                    │           │                                │
│           Correct Code    Wrong Code                            │
│                    │           │                                │
│                    ↓           ↓                                │
│  SUCCESS        FAILED ATTEMPT                                  │
│  ┌──────┐      ┌──────────────────────────────────────────┐    │
│  │DELETE│      │ attempts: attempts + 1                    │    │
│  │RECORD│      │ if attempts >= 5:                         │    │
│  └──────┘      │   locked_until: now() + 15 minutes        │    │
│                └──────────────────────────────────────────┘    │
│                                                                 │
│  LOCKED: After 5 failed attempts                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ phone: +212664352280                                      │  │
│  │ attempts: 5                                               │  │
│  │ locked_until: now() + 15 minutes                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          │ Wait 15 minutes                      │
│                          ↓                                      │
│  UNLOCKED: Lockout expired, can request new OTP                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## File Dependencies

```
Frontend (React)
    │
    ├── OTPLogin.tsx
    │   └── calls: /api/otp/request, /api/otp/verify
    │
    └── OTPLoginExample.tsx
        └── uses: OTPLogin.tsx

API Routes (Vercel Serverless)
    │
    ├── api/otp/request.ts
    │   ├── uses: lib/supabaseAdmin.ts
    │   ├── uses: lib/phone.ts
    │   ├── uses: lib/otp.ts
    │   └── uses: @vonage/server-sdk
    │
    └── api/otp/verify.ts
        ├── uses: lib/supabaseAdmin.ts
        ├── uses: lib/phone.ts
        ├── uses: lib/otp.ts
        └── uses: lib/jwt.ts

Helper Libraries
    │
    ├── lib/supabaseAdmin.ts
    │   └── uses: @supabase/supabase-js
    │
    ├── lib/phone.ts
    │   └── uses: libphonenumber-js
    │
    ├── lib/jwt.ts
    │   └── uses: jsonwebtoken
    │
    └── lib/otp.ts
        └── uses: bcryptjs, crypto

Database
    │
    └── supabase/migrations/086_otp_attempts_table.sql
        └── creates: otp_attempts table
```

## Environment Variables Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  VERCEL PROJECT SETTINGS                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SUPABASE_URL              ─┐                              │  │
│  │ VITE_SUPABASE_URL         ─┼─→ lib/supabaseAdmin.ts      │  │
│  │ SUPABASE_SERVICE_ROLE_KEY ─┘                              │  │
│  │                                                           │  │
│  │ VONAGE_API_KEY            ─┐                              │  │
│  │ VONAGE_API_SECRET         ─┼─→ api/otp/request.ts        │  │
│  │ VONAGE_FROM               ─┘                              │  │
│  │                                                           │  │
│  │ JWT_SECRET                ───→ lib/jwt.ts                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         │ Deployed to                           │
│                         ↓                                       │
│  VERCEL SERVERLESS FUNCTIONS                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ process.env.VONAGE_API_KEY                                │  │
│  │ process.env.VONAGE_API_SECRET                             │  │
│  │ process.env.JWT_SECRET                                    │  │
│  │ process.env.SUPABASE_SERVICE_ROLE_KEY                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ⚠️  NEVER EXPOSED TO CLIENT                                    │
│  ✅  Server-side only                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Timeline: Request to Authentication

```
Time   Event                                    Duration
─────────────────────────────────────────────────────────────────
0s     User enters phone number
       │
       └─→ Click "Send Code"
           │
1s     ├─→ API validates phone                  ~100ms
       ├─→ Check rate limit (DB query)          ~50ms
       ├─→ Generate OTP (crypto)                ~1ms
       ├─→ Hash OTP (bcrypt)                    ~100ms
       ├─→ Store in database                    ~50ms
       ├─→ Send SMS via Vonage                  ~500ms
       │
2s     └─→ User receives "OTP sent" message
           │
[User receives SMS]
           │
5s     User enters OTP code
       │
       └─→ Click "Verify"
           │
6s     ├─→ API validates code format            ~1ms
       ├─→ Load OTP record from DB              ~50ms
       ├─→ Check lockout status                 ~1ms
       ├─→ Check expiration                     ~1ms
       ├─→ Compare hash (bcrypt)                ~100ms
       ├─→ Generate JWT token                   ~10ms
       ├─→ Delete OTP record                    ~50ms
       │
7s     └─→ Return JWT token to user
           │
       User authenticated! 🎉
```

## Success Criteria Checklist

```
✅ SMS delivered within 30 seconds
✅ OTP codes work on first try
✅ Rate limiting prevents abuse (max 3/hour)
✅ Lockout prevents brute force (5 attempts = 15 min)
✅ OTP expires after 5 minutes
✅ JWT tokens are valid and verifiable
✅ Database records managed properly
✅ No security vulnerabilities
✅ Phone numbers normalize correctly
✅ UI provides good UX
✅ All TypeScript compiles
✅ Build succeeds
✅ Zero npm vulnerabilities
✅ CodeQL security scan passed
```

---

**Last Updated**: February 8, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
