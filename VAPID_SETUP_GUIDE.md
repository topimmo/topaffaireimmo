# VAPID Web Push Notifications Setup Guide

**For Non-Experts: Exact Step-by-Step Instructions**

This guide tells you EXACTLY what to do, where to click, and what values to use to set up Web Push Notifications with VAPID keys for TopAffaireImmo.

---

## 📋 WHAT YOU'LL DO

1. Generate VAPID keys on your local machine
2. Add the PUBLIC key to Vercel (frontend)
3. Add BOTH keys to Supabase (backend)
4. Verify the code is using them correctly
5. Test that everything works

**Time Required**: 15-20 minutes  
**Difficulty**: Easy (copy-paste mostly)

---

## ⚠️ CRITICAL SECURITY RULES

Before we start, understand these rules:

| Key Type | Where It Goes | Can Be Exposed? |
|----------|---------------|-----------------|
| **VAPID Public Key** | Frontend (Vercel) | ✅ YES - Safe to expose |
| **VAPID Private Key** | Backend (Supabase) | ❌ NO - NEVER expose this |

**NEVER**:
- ❌ Put the PRIVATE key in Vercel environment variables
- ❌ Put the PRIVATE key in any frontend code
- ❌ Commit the PRIVATE key to git
- ❌ Share the PRIVATE key in screenshots/emails

**ALWAYS**:
- ✅ Keep PRIVATE key only in Supabase Edge Function secrets
- ✅ Use environment variables, never hardcode keys
- ✅ PUBLIC key can safely go in frontend code

---

## STEP 1 — GENERATE VAPID KEYS

### Where to run the command
- **Location**: Your local machine
- **Directory**: The root of the `topaffaireimmo` repository
- **Terminal**: Open your terminal/command prompt

### Exact command to run

```bash
npm run generate:vapid-keys
```

### What happens
The command runs the script located at: `/scripts/generate-vapid-keys.ts`

It will output something like this:

```
🔐 Generating VAPID Keys for Web Push Notifications...

✅ VAPID Keys Generated Successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Public Key (use in frontend):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEl0K9Jd8X7k_example_public_key_here_vQx2z...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Private Key (use in backend - KEEP SECRET):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
aB3d_example_private_key_here_sY9z...
```

### What each value is

| Value | Description | Security |
|-------|-------------|----------|
| **Public Key** | Used by browsers to subscribe to notifications | ✅ Safe to expose |
| **Private Key** | Used by server to send notifications | 🔒 KEEP SECRET |

### What you must NEVER expose
- The **Private Key** - This is like a password. If someone gets it, they can send fake notifications pretending to be your app.

### What to do with the output

1. **Copy the Public Key** to a temporary text file
2. **Copy the Private Key** to a DIFFERENT temporary text file
3. **Label them clearly**: "PUBLIC" and "PRIVATE (SECRET)"
4. **Keep both text files open** - you'll need them in the next steps

### Files created
**None** - The keys are only shown in the terminal. You must copy them manually.

### Common mistakes
❌ Running the command from wrong directory  
✅ **Solution**: Make sure you're in the repo root (where `package.json` is)

❌ Getting an error "command not found"  
✅ **Solution**: Run `npm install` first

❌ Mixing up public and private keys  
✅ **Solution**: The script labels them clearly - double-check!

---

## STEP 2 — FRONTEND (VERCEL) ENVIRONMENT VARIABLES

### Where to go in Vercel
1. Log in to [Vercel Dashboard](https://vercel.com)
2. Click on your project: **topaffaireimmo**
3. Click **Settings** (in the top navigation)
4. Click **Environment Variables** (in the left sidebar)

**Path**: `Dashboard → topaffaireimmo → Settings → Environment Variables`

### Which variable to add

**Variable Name:**
```
VITE_VAPID_PUBLIC_KEY
```

**Value:**
- Paste the **PUBLIC KEY** you copied from Step 1
- Example: `BEl0K9Jd8X7k_example_public_key_here_vQx2z...`

### Which environments to select

Select **ALL THREE** checkboxes:
- ✅ Production
- ✅ Preview
- ✅ Development

**Why all three?**
- Production: For live users
- Preview: For testing deployment previews
- Development: For local testing with Vercel

### How to add the variable

1. Click **Add New** button
2. **Name**: Type `VITE_VAPID_PUBLIC_KEY`
3. **Value**: Paste your PUBLIC key (the long string from Step 1)
4. **Environments**: Check all three boxes (Production, Preview, Development)
5. Click **Save**

### How to verify it's correct

After saving:
1. You should see the variable listed
2. The value should start with something like `B...` (capital B)
3. It should be 87-88 characters long
4. The environments should show: Production, Preview, Development

### What it should look like

```
Name: VITE_VAPID_PUBLIC_KEY
Value: BEl0K9Jd8X7k... (masked)
Environments: Production, Preview, Development
```

### Common mistakes

❌ **Using PRIVATE key instead of PUBLIC**  
✅ **Solution**: The PUBLIC key is the FIRST one shown in Step 1 output

❌ **Forgetting the VITE_ prefix**  
✅ **Solution**: The variable MUST be named `VITE_VAPID_PUBLIC_KEY` (Vite requires the `VITE_` prefix for frontend variables)

❌ **Only selecting Production environment**  
✅ **Solution**: Select all three environments

❌ **Extra spaces in the value**  
✅ **Solution**: Copy the key exactly as shown, no spaces before or after

### For local development

Also add this to your local `.env` file:

1. Open the file: `/topaffaireimmo/.env` (create it if it doesn't exist)
2. Add this line:
   ```
   VITE_VAPID_PUBLIC_KEY=your_public_key_here
   ```
3. Replace `your_public_key_here` with your actual PUBLIC key
4. Save the file

**Important**: Never commit the `.env` file to git. It's already in `.gitignore`.

---

## STEP 3 — BACKEND (SUPABASE) SECRETS

You need to add **THREE** secrets to Supabase:
1. `VAPID_PUBLIC_KEY` - Your public key
2. `VAPID_PRIVATE_KEY` - Your private key (SECRET!)
3. `VAPID_SUBJECT` - Your contact email

### Method A: Using Supabase Dashboard (Recommended for Beginners)

#### Where to go
1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **topaffaireimmo**
3. Click **Edge Functions** (in the left sidebar)
4. Click **Manage secrets** button (top right)

**Path**: `Supabase Dashboard → Your Project → Edge Functions → Manage secrets`

#### How to add each secret

**Secret 1: VAPID_PUBLIC_KEY**
1. Click **Add new secret**
2. **Name**: Type `VAPID_PUBLIC_KEY` (exactly like this, no VITE_ prefix!)
3. **Value**: Paste your PUBLIC key
4. Click **Save**

**Secret 2: VAPID_PRIVATE_KEY**
1. Click **Add new secret**
2. **Name**: Type `VAPID_PRIVATE_KEY` (exactly like this)
3. **Value**: Paste your PRIVATE key (the second one from Step 1)
4. Click **Save**

**Secret 3: VAPID_SUBJECT**
1. Click **Add new secret**
2. **Name**: Type `VAPID_SUBJECT` (exactly like this)
3. **Value**: Type `mailto:contact@topaffaireimmo.com`
4. Click **Save**

#### What you should see
After adding all three, you should see:
```
VAPID_PUBLIC_KEY      ******* (masked)
VAPID_PRIVATE_KEY     ******* (masked)
VAPID_SUBJECT         mailto:contact@topaffaireimmo.com
```

### Method B: Using Supabase CLI (For Advanced Users)

#### Prerequisites
1. Supabase CLI must be installed
2. You must be logged in: `supabase login`
3. You must be linked to your project: `supabase link --project-ref YOUR_PROJECT_ID`

#### Where to run
Open terminal in the repository root: `/topaffaireimmo/`

#### Exact commands to run

Replace `YOUR_PUBLIC_KEY`, `YOUR_PRIVATE_KEY` with the actual values from Step 1:

```bash
supabase secrets set VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY"
```

```bash
supabase secrets set VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY"
```

```bash
supabase secrets set VAPID_SUBJECT="mailto:contact@topaffaireimmo.com"
```

**Example** (with fake keys):
```bash
supabase secrets set VAPID_PUBLIC_KEY="BEl0K9Jd8X7k_example_public_key_here_vQx2z"
supabase secrets set VAPID_PRIVATE_KEY="aB3d_example_private_key_here_sY9z"
supabase secrets set VAPID_SUBJECT="mailto:contact@topaffaireimmo.com"
```

#### Verify they were set
```bash
supabase secrets list
```

You should see:
```
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

### Why these must NOT start with VITE_

**IMPORTANT SECURITY CONCEPT:**

| Prefix | Where It Goes | Who Can See It |
|--------|---------------|----------------|
| `VITE_` | Frontend | ✅ Anyone (users, browsers) |
| No prefix | Backend | 🔒 Only server |

In Supabase Edge Functions:
- Variables **without** `VITE_` prefix are server-side only
- Variables **with** `VITE_` prefix would be exposed to frontend
- The PRIVATE key MUST stay server-side

That's why:
- ✅ Supabase uses: `VAPID_PRIVATE_KEY` (no prefix)
- ✅ Vercel uses: `VITE_VAPID_PUBLIC_KEY` (with prefix - safe to expose)

### How to verify they are NOT exposed to frontend

1. Open your app in browser (development or production)
2. Open browser console (F12 → Console)
3. Type: `import.meta.env`
4. Press Enter
5. **Look for**: `VITE_VAPID_PUBLIC_KEY` - This SHOULD appear ✅
6. **Look for**: `VAPID_PRIVATE_KEY` - This should NOT appear ✅

**What you should see:**
```javascript
{
  VITE_VAPID_PUBLIC_KEY: "BEl0K9Jd8X7k...",  // ✅ Good - this is public
  VITE_SUPABASE_URL: "https://...",
  VITE_SUPABASE_ANON_KEY: "...",
  // VAPID_PRIVATE_KEY should NOT be here!
}
```

**If you see `VAPID_PRIVATE_KEY` in the frontend console:**
- 🚨 **SECURITY ISSUE** - Stop immediately!
- Remove it from Vercel environment variables
- Regenerate your VAPID keys (run Step 1 again)
- Start over with new keys

---

## STEP 4 — VERIFY CODE USAGE

Let me scan the repository and confirm where each key is used.

### Files where VITE_VAPID_PUBLIC_KEY is used

✅ **Frontend files** (correct usage):

1. **`/src/lib/pushNotifications.ts`** (Line 90)
   ```typescript
   const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
   ```
   - ✅ Used to subscribe users to push notifications
   - ✅ Safe - this is frontend code

2. **`/.env.example`** (Line 110)
   ```bash
   VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
   ```
   - ✅ Example file showing developers what to configure
   - ✅ Safe - this is just a template

3. **`/scripts/generate-vapid-keys.ts`** (Line 74)
   ```typescript
   console.log('   VITE_VAPID_PUBLIC_KEY=' + publicKey);
   ```
   - ✅ Script that generates the keys
   - ✅ Safe - just showing instructions

### Files where push subscription is handled

✅ **Push subscription logic** (correct implementation):

1. **`/src/lib/pushNotifications.ts`**
   - Function: `subscribeToPushNotifications()` (Line 74-153)
   - What it does:
     - Gets the VAPID public key from environment
     - Subscribes user to push notifications
     - Stores subscription in Supabase database
   - ✅ Correct implementation

2. **`/src/components/pwa/PushNotificationToggle.tsx`**
   - UI component that lets users enable/disable notifications
   - Calls `subscribeToPushNotifications()` and `unsubscribeFromPushNotifications()`
   - ✅ Correct implementation

3. **`/src/pages/Dashboard.tsx`**
   - Displays the `<PushNotificationToggle />` component
   - User-facing UI for managing notifications
   - ✅ Correct implementation

### Edge Function that sends push notifications

✅ **Backend (server-side only)**:

**`/supabase/functions/send-push-notification/index.ts`**
- What it does:
  - Receives requests from admins to send notifications
  - Fetches active subscriptions from database
  - Sends push notifications using Web Push Protocol
- VAPID keys used (Lines 10-12):
  ```typescript
  const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
  const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')
  ```
- ✅ **CORRECT**: Uses `Deno.env.get()` (server-side only)
- ✅ **CORRECT**: No `VITE_` prefix (not exposed to frontend)
- ✅ **CORRECT**: Uses BOTH public and private keys

### Confirm PRIVATE KEY is ONLY used server-side

✅ **Verification:**

**Where PRIVATE key is used:**
- ✅ `/supabase/functions/send-push-notification/index.ts` (Edge Function)
  - This code runs on Supabase servers, NOT in the browser
  - Private key is accessed via `Deno.env.get('VAPID_PRIVATE_KEY')`
  - ✅ Correct and secure

**Where PRIVATE key is NOT used (as it should be):**
- ✅ NOT in any `/src/` files (frontend code)
- ✅ NOT in Vercel environment variables
- ✅ NOT in any browser-accessible code
- ✅ NOT in git repository (see `.gitignore`)

### What the code structure looks like

```
Frontend (Browser)
├── Uses: VITE_VAPID_PUBLIC_KEY ✅
├── Files: src/lib/pushNotifications.ts
├── Files: src/components/pwa/PushNotificationToggle.tsx
└── Action: Subscribe to notifications

Backend (Supabase)
├── Uses: VAPID_PUBLIC_KEY ✅
├── Uses: VAPID_PRIVATE_KEY ✅ (SECRET!)
├── Uses: VAPID_SUBJECT ✅
├── Files: supabase/functions/send-push-notification/index.ts
└── Action: Send notifications to subscribed users
```

### Is anything missing?

✅ **Nothing is missing!** The implementation is complete:

- ✅ VAPID key generation script: `/scripts/generate-vapid-keys.ts`
- ✅ Frontend subscription code: `/src/lib/pushNotifications.ts`
- ✅ UI toggle component: `/src/components/pwa/PushNotificationToggle.tsx`
- ✅ Service Worker push handlers: `/src/sw.ts`
- ✅ Backend Edge Function: `/supabase/functions/send-push-notification/index.ts`
- ✅ Database migration: `/supabase/migrations/076_create_push_subscriptions_table.sql`
- ✅ Documentation: Multiple guides available

**Everything you need is already implemented!** You just need to configure the environment variables (Steps 1-3).

---

## STEP 5 — FINAL CHECKLIST

Use this checklist to ensure everything is set up correctly:

### Configuration Checklist

```
☐ VAPID keys generated (Step 1)
  ├─ ☐ Public key saved
  ├─ ☐ Private key saved
  └─ ☐ Both keys are different from each other

☐ Vercel environment variables added (Step 2)
  ├─ ☐ Variable name: VITE_VAPID_PUBLIC_KEY
  ├─ ☐ Value: Public key pasted
  ├─ ☐ Environments: All three selected
  └─ ☐ Verified in Vercel dashboard

☐ Supabase secrets added (Step 3)
  ├─ ☐ VAPID_PUBLIC_KEY set
  ├─ ☐ VAPID_PRIVATE_KEY set
  ├─ ☐ VAPID_SUBJECT set
  └─ ☐ Verified using dashboard or CLI

☐ Local .env file updated (Step 2)
  └─ ☐ VITE_VAPID_PUBLIC_KEY added

☐ Code verification (Step 4)
  ├─ ☐ Frontend uses VITE_VAPID_PUBLIC_KEY
  ├─ ☐ Backend uses VAPID_PRIVATE_KEY
  └─ ☐ Private key NOT visible in browser console
```

### Deployment Checklist

After configuration is complete:

```
☐ Deploy Edge Function to Supabase
  └─ Run: supabase functions deploy send-push-notification

☐ Redeploy frontend to Vercel
  ├─ Push code to git (if not already)
  ├─ Vercel auto-deploys
  └─ Or trigger manual deploy in Vercel dashboard

☐ Verify deployment
  └─ Check Vercel deployment logs for any errors
```

### Testing Checklist

```
☐ Test in development (local)
  ├─ ☐ Run: npm run dev
  ├─ ☐ Open: http://localhost:5173
  ├─ ☐ Log in to your account
  ├─ ☐ Go to Dashboard
  ├─ ☐ Toggle "Notifications" switch ON
  ├─ ☐ Browser asks for permission
  ├─ ☐ Click "Allow"
  └─ ☐ Toggle shows "Enabled"

☐ Test in production
  ├─ ☐ Open: https://topaffaireimmo.com (or your production URL)
  ├─ ☐ Log in
  ├─ ☐ Go to Dashboard
  ├─ ☐ Toggle notifications ON
  ├─ ☐ Permission granted
  └─ ☐ Toggle shows "Enabled"

☐ Test sending notification (admin only)
  ├─ ☐ Log in as admin
  ├─ ☐ Open browser console (F12)
  ├─ ☐ Run test command (see below)
  └─ ☐ Notification appears on device
```

### Test Command (Admin Only)

To test if notifications work, open browser console and run:

```javascript
// Test notification (requires admin privileges)
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    send_to_all: true,
    payload: {
      title: 'Test Notification',
      body: 'If you see this, push notifications are working!',
      icon: '/icons/icon-192.png',
      data: { url: '/' }
    }
  }
});

console.log('Result:', data, error);
```

**Expected result:**
- A notification appears on your device
- Console shows: `Result: { success: true, sent: 1, ... } null`

### Browser Support Check

```
☐ Test on supported browsers
  ├─ ☐ Chrome Desktop (✅ Fully supported)
  ├─ ☐ Edge Desktop (✅ Fully supported)
  ├─ ☐ Firefox Desktop (✅ Fully supported)
  ├─ ☐ Chrome Android (✅ Fully supported)
  ├─ ☐ Safari iOS 16.4+ (✅ Supported)
  └─ ☐ Safari iOS < 16.4 (❌ Not supported - should show "not supported" message)
```

---

## 🎯 QUICK REFERENCE

### Environment Variables Summary

| Variable | Where | Value Type | Exposed? |
|----------|-------|------------|----------|
| `VITE_VAPID_PUBLIC_KEY` | Vercel + .env | Public Key | ✅ Yes (safe) |
| `VAPID_PUBLIC_KEY` | Supabase | Public Key | ❌ No (server) |
| `VAPID_PRIVATE_KEY` | Supabase | Private Key | ❌ No (SECRET!) |
| `VAPID_SUBJECT` | Supabase | Email | ❌ No (server) |

### Key Locations Summary

```
Public Key goes to:
  1. Vercel → Environment Variables → VITE_VAPID_PUBLIC_KEY
  2. Local .env → VITE_VAPID_PUBLIC_KEY
  3. Supabase → Edge Functions Secrets → VAPID_PUBLIC_KEY

Private Key goes to:
  1. Supabase → Edge Functions Secrets → VAPID_PRIVATE_KEY
  (NOWHERE ELSE!)

Subject goes to:
  1. Supabase → Edge Functions Secrets → VAPID_SUBJECT
```

### Commands Quick Reference

```bash
# Generate VAPID keys
npm run generate:vapid-keys

# Add to Supabase (CLI method)
supabase secrets set VAPID_PUBLIC_KEY="your_public_key"
supabase secrets set VAPID_PRIVATE_KEY="your_private_key"
supabase secrets set VAPID_SUBJECT="mailto:contact@topaffaireimmo.com"

# List Supabase secrets
supabase secrets list

# Deploy Edge Function
supabase functions deploy send-push-notification

# Run development server
npm run dev
```

---

## 🐛 TROUBLESHOOTING

### Problem: "VAPID public key not configured"

**What you see:**
- Toggle doesn't enable
- Console shows: "VAPID public key not configured"

**Cause:** `VITE_VAPID_PUBLIC_KEY` is missing or wrong

**Solution:**
1. Check Vercel environment variables
2. Check local `.env` file
3. Make sure variable name is exactly `VITE_VAPID_PUBLIC_KEY`
4. Redeploy after changing Vercel variables

---

### Problem: "Permission denied"

**What you see:**
- Toggle won't enable
- Browser blocked notifications

**Cause:** User clicked "Block" when asked for permission

**Solution:**
1. User must manually allow in browser settings
2. **Chrome**: Settings → Privacy and security → Site settings → Notifications
3. **Firefox**: Settings → Privacy & Security → Permissions → Notifications
4. **Safari**: Safari → Settings → Websites → Notifications
5. Find your site and change to "Allow"

---

### Problem: "Push notifications not supported"

**What you see:**
- Message: "Push notifications not supported"
- Toggle is disabled

**Cause:** Browser doesn't support push (old iOS, old browser)

**Solution:**
- Update browser to latest version
- iOS: Update to iOS 16.4 or newer
- Android: Update Chrome to latest
- Desktop: Update browser

---

### Problem: Notification doesn't appear

**What you see:**
- Toggle shows "Enabled"
- Admin sends notification
- No notification appears

**Possible causes and solutions:**

**1. VAPID keys not set in Supabase**
- Solution: Check Step 3, verify secrets are set

**2. VAPID keys don't match**
- Public key in Vercel doesn't match public key in Supabase
- Solution: Use the same keys from Step 1 in both places

**3. Edge Function not deployed**
- Solution: Run `supabase functions deploy send-push-notification`

**4. Browser notifications blocked**
- Solution: Check browser notification settings

**5. Service worker not registered**
- Solution: Open DevTools → Application → Service Workers
- Should show service worker as "activated"
- If not, hard refresh the page (Ctrl+Shift+R)

---

### Problem: Private key visible in frontend

**What you see:**
- Opening browser console
- Typing `import.meta.env`
- Seeing `VAPID_PRIVATE_KEY` or `VITE_VAPID_PRIVATE_KEY`

**Cause:** 🚨 **CRITICAL SECURITY ISSUE** - Private key was added to Vercel

**Solution:**
1. **Immediately** remove from Vercel environment variables
2. Go to Vercel → Settings → Environment Variables
3. Delete `VAPID_PRIVATE_KEY` or `VITE_VAPID_PRIVATE_KEY`
4. **Generate new keys** (Step 1) - old ones are compromised
5. Update Supabase with new keys (Step 3)
6. Update Vercel with new PUBLIC key only (Step 2)
7. Redeploy

---

### Problem: "Error storing subscription"

**What you see:**
- Toggle tries to enable
- Shows error message
- Console: "Error storing subscription"

**Possible causes:**

**1. Database not migrated**
- Solution: Run migration `/supabase/migrations/076_create_push_subscriptions_table.sql`
- In Supabase Dashboard → SQL Editor → paste and run

**2. RLS policies blocking**
- Solution: Check that RLS policies allow inserts
- User should be authenticated

**3. Network issue**
- Solution: Check internet connection
- Check Supabase project is online

---

### Problem: Admin can't send notifications

**What you see:**
- Calling Edge Function fails
- Error: "Forbidden: Only admins can send push notifications"

**Cause:** User is not in `admins` table or not active

**Solution:**
1. Check user is in `admins` table
2. Check `is_active = true` for that admin
3. Use Supabase Dashboard → Table Editor → admins
4. Add user or set `is_active = true`

---

### Problem: Keys generated but command shows error

**What you see:**
- Running `npm run generate:vapid-keys`
- Error message or crash

**Possible causes:**

**1. Node version too old**
- Solution: Update Node to v18 or v20
- Check: `node --version`

**2. Dependencies not installed**
- Solution: Run `npm install`

**3. TypeScript not compiled**
- Solution: Command uses `tsx` which compiles on-the-fly
- If error persists, check `/scripts/generate-vapid-keys.ts` exists

---

## 📞 NEED HELP?

### Before asking for help, check:

1. ✅ Did you complete all steps in order?
2. ✅ Did you verify each step was successful?
3. ✅ Did you check the troubleshooting section above?
4. ✅ Did you check browser console for specific error messages?
5. ✅ Did you check Supabase Edge Function logs?

### Information to provide when asking for help:

1. Which step are you stuck on? (Step 1, 2, 3, 4, or 5)
2. Exact error message (copy-paste from console)
3. What you expected to happen
4. What actually happened
5. Browser and version (Chrome 120, Safari 17, etc.)
6. Screenshots (but NEVER include private key!)

### Where to find logs:

**Frontend logs:**
- Browser console (F12 → Console)
- Look for messages starting with `[Push]`

**Backend logs:**
- Supabase Dashboard → Edge Functions → send-push-notification
- Click "Logs" tab
- Shows function execution logs

**Vercel logs:**
- Vercel Dashboard → Your Project → Deployments
- Click on a deployment → "Function Logs" or "Build Logs"

---

## 📚 RELATED DOCUMENTATION

For more technical details, see:

- **Quick Start**: `/PUSH_NOTIFICATIONS_QUICK_START.md`
- **Full Implementation**: `/PUSH_NOTIFICATIONS_IMPLEMENTATION.md`
- **UI Guide**: `/PUSH_NOTIFICATIONS_UI_GUIDE.md`
- **Edge Function README**: `/supabase/functions/send-push-notification/README.md`
- **Environment Variables Example**: `/.env.example`

---

## ✅ COMPLETION CONFIRMATION

After completing all steps, you should have:

1. ✅ Generated VAPID keys locally
2. ✅ Added `VITE_VAPID_PUBLIC_KEY` to Vercel
3. ✅ Added `VITE_VAPID_PUBLIC_KEY` to local `.env`
4. ✅ Added three secrets to Supabase:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
5. ✅ Verified private key is NOT in frontend
6. ✅ Deployed Edge Function
7. ✅ Deployed frontend
8. ✅ Tested notifications work

**Congratulations! Web Push Notifications are now set up for TopAffaireImmo! 🎉**

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Maintained By**: TopAffaireImmo Development Team
