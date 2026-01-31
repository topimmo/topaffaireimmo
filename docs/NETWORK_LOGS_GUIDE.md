# Network Request/Response Documentation
## Approve/Reject Flow - HTTP Traffic Analysis

This document provides complete details on the network requests made during the Approve/Reject flow, including how to capture, analyze, and troubleshoot them.

---

## Table of Contents

1. [Request Overview](#request-overview)
2. [Approve Request Details](#approve-request-details)
3. [Reject Request Details](#reject-request-details)
4. [Response Formats](#response-formats)
5. [Error Responses](#error-responses)
6. [How to Capture Network Logs](#how-to-capture-network-logs)
7. [JWT Token Analysis](#jwt-token-analysis)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## Request Overview

### Endpoint
```
POST https://[your-project-ref].supabase.co/rest/v1/properties
```

**Query Parameters:**
- `id=eq.[property-uuid]` - Filter to update specific property

**HTTP Method:** POST (Supabase uses POST for updates via PostgREST)

**Content Type:** application/json

---

## Approve Request Details

### Complete HTTP Request

```http
POST /rest/v1/properties?id=eq.123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: xyzhypbkcvdxlfnmqpoj.supabase.co
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emh5cGJrY3ZkeGxmbm1xcG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk4NTY3MzcsImV4cCI6MjAwNTQzMjczN30.xxxxxxxxxxxxxx
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzdWIiOiI5ODdmY2RlYi01MWEyLTQzZjEtOGExYi0xMjM0NTY3ODlhYmMiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA2Nzg5NDU2LCJleHAiOjE3MDY3OTMwNTZ9.xxxxxxxxxxxxxx
Prefer: return=representation
Accept: application/json
Content-Length: 189

{
  "status": "approved",
  "approved_at": "2024-01-31T12:34:56.789Z",
  "approved_by": "987fcdeb-51a2-43f1-8a1b-123456789abc",
  "published_at": "2024-01-31T12:34:56.789Z"
}
```

### Request Headers Breakdown

| Header | Value | Purpose |
|--------|-------|---------|
| `Host` | your-project-ref.supabase.co | Supabase project domain |
| `Content-Type` | application/json | Request body format |
| `apikey` | eyJhbGci... | Public anon key (from env) |
| `Authorization` | Bearer eyJhbGci... | User's JWT access token |
| `Prefer` | return=representation | Return updated row in response |
| `Accept` | application/json | Expected response format |

**Important Headers:**
- **apikey**: Public anonymous key from your Supabase project settings
- **Authorization**: User's JWT token obtained from `supabase.auth.getSession()`
- **Prefer: return=representation**: Tells PostgREST to return the updated row (without this, you get no response body)

### Request Body (Approve)

```json
{
  "status": "approved",
  "approved_at": "2024-01-31T12:34:56.789Z",
  "approved_by": "987fcdeb-51a2-43f1-8a1b-123456789abc",
  "published_at": "2024-01-31T12:34:56.789Z"
}
```

**Field Descriptions:**

| Field | Type | Value | Description |
|-------|------|-------|-------------|
| `status` | string | "approved" | New status value |
| `approved_at` | string (ISO 8601) | Current timestamp | When approval occurred |
| `approved_by` | string (UUID) | Admin user ID | Who approved it |
| `published_at` | string (ISO 8601) | Current timestamp | When published (same as approved_at) |

**Code that generates this:**
```typescript
const updateData: any = { status: 'approved' };

if (newStatus === 'approved') {
  const now = new Date().toISOString();
  updateData.approved_at = now;
  updateData.approved_by = user?.id || null;
  updateData.published_at = now;
}

await supabase
  .from('properties')
  .update(updateData)
  .eq('id', propertyId)
  .select();
```

---

## Reject Request Details

### Complete HTTP Request

```http
POST /rest/v1/properties?id=eq.123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: xyzhypbkcvdxlfnmqpoj.supabase.co
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Prefer: return=representation
Accept: application/json
Content-Length: 52

{
  "status": "rejected",
  "rejection_reason": "Does not meet quality standards"
}
```

### Request Body (Reject)

```json
{
  "status": "rejected",
  "rejection_reason": "Does not meet quality standards"
}
```

**Note:** Rejection is simpler - only updates status and optionally adds a reason.

**Field Descriptions:**

| Field | Type | Value | Description |
|-------|------|-------|-------------|
| `status` | string | "rejected" | New status value |
| `rejection_reason` | string | Optional text | Why it was rejected (optional) |

---

## Response Formats

### Success Response (200 OK)

**HTTP Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Range: 0-0/*
```

**Response Body:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "owner_id": "abc12345-6789-0def-ghij-klmnopqrstuv",
    "property_type": "apartment",
    "transaction_type": "sale",
    "city_id": 1,
    "price": 500000,
    "title_fr": "Villa moderne à Casablanca",
    "title_ar": "فيلا حديثة في الدار البيضاء",
    "description_fr": "Belle villa moderne...",
    "description_ar": "فيلا جميلة حديثة...",
    "status": "approved",
    "approved_at": "2024-01-31T12:34:56.789Z",
    "approved_by": "987fcdeb-51a2-43f1-8a1b-123456789abc",
    "published_at": "2024-01-31T12:34:56.789Z",
    "rejection_reason": null,
    "created_at": "2024-01-30T10:00:00.000Z",
    "updated_at": "2024-01-31T12:34:56.789Z",
    "images": [],
    "features": []
  }
]
```

**Key Points:**
- Response is an **array** (even for single update)
- Contains the complete updated row
- All fields are returned (because of `.select()` in code)

**Response Headers:**
- `Content-Range: 0-0/*` - Indicates 1 row was updated
- `Content-Type: application/json`

---

### Empty Response (204 No Content)

**Scenario:** If you don't include `.select()` in Supabase query

**HTTP Response:**
```http
HTTP/1.1 204 No Content
Content-Range: 0-0/*
```

**Response Body:** (empty)

**Note:** The code currently uses `.select()`, so you should always get 200 OK with data.

---

## Error Responses

### Error Response Format

All Supabase errors follow this format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": "Additional details (may be null)",
  "hint": "Suggestion for fixing (may be null)"
}
```

---

### Error 1: Permission Denied (403 Forbidden)

**HTTP Response:**
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json
```

**Response Body:**
```json
{
  "code": "42501",
  "message": "new row violates row-level security policy for table \"properties\"",
  "details": null,
  "hint": null
}
```

**Meaning:**
- RLS (Row Level Security) blocked the update
- User doesn't have permission to update this property
- Most likely: User is not in `admins` table

**How to Diagnose:**
```sql
-- Check if user is admin
SELECT * FROM public.admins WHERE user_id = auth.uid();
```

**How to Fix:**
- Add user to admins table (see SQL scripts)

---

### Error 2: JWT Token Missing/Invalid (401 Unauthorized)

**HTTP Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json
```

**Response Body:**
```json
{
  "code": "PGRST301",
  "message": "JWT token is missing or invalid",
  "details": null,
  "hint": null
}
```

**Meaning:**
- No Authorization header
- JWT token is expired
- JWT token is malformed

**How to Diagnose:**
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Token:', session?.access_token);
```

**How to Fix:**
- Re-login to get fresh token
- Check token expiry: JWT typically expires after 1 hour

---

### Error 3: Check Constraint Violation (400 Bad Request)

**HTTP Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

**Response Body:**
```json
{
  "code": "23514",
  "message": "new row for relation \"properties\" violates check constraint \"properties_status_check\"",
  "details": "Failing row contains (..., invalid_status, ...)",
  "hint": null
}
```

**Meaning:**
- Status value not in allowed list
- Constraint: `CHECK (status IN ('pending', 'approved', 'rejected', 'sold', 'rented', 'expired', 'archived'))`

**How to Diagnose:**
- Check request body in Network tab
- Verify status value is exactly one of the allowed values (lowercase)

**How to Fix:**
- Use correct status value
- Check for typos

---

### Error 4: Property Not Found (406 Not Acceptable)

**HTTP Response:**
```http
HTTP/1.1 406 Not Acceptable
Content-Type: application/json
```

**Response Body:**
```json
{
  "code": "PGRST116",
  "message": "The result contains 0 rows",
  "details": null,
  "hint": null
}
```

**Meaning:**
- Property with this ID doesn't exist
- Or RLS blocked SELECT before UPDATE

**How to Diagnose:**
```sql
SELECT * FROM properties WHERE id = 'property-uuid';
```

**How to Fix:**
- Verify property ID is correct
- Check RLS policies allow you to view this property

---

### Error 5: Foreign Key Violation (409 Conflict)

**HTTP Response:**
```http
HTTP/1.1 409 Conflict
Content-Type: application/json
```

**Response Body:**
```json
{
  "code": "23503",
  "message": "insert or update on table \"properties\" violates foreign key constraint",
  "details": "Key (approved_by)=(xxx-xxx-xxx) is not present in table \"auth.users\"",
  "hint": null
}
```

**Meaning:**
- `approved_by` UUID doesn't exist in auth.users table

**How to Fix:**
- Ensure you're using a valid user UUID
- Check `approved_by` value in request body

---

## How to Capture Network Logs

### Method 1: Chrome DevTools

1. **Open DevTools:** Press `F12` or `Ctrl+Shift+I`
2. **Go to Network tab**
3. **Filter:** Click "Fetch/XHR" to show only API calls
4. **Clear:** Click 🚫 to clear previous requests
5. **Trigger:** Click Approve/Reject button
6. **Find Request:** Look for POST to `rest/v1/properties`
7. **Inspect:** Click on the request to see details

**Tabs to Check:**
- **Headers:** Request headers, response headers
- **Payload:** Request body (JSON)
- **Response:** Response body (JSON)
- **Timing:** How long the request took

### Method 2: Export as HAR

1. Right-click in Network tab
2. Select "Save all as HAR with content"
3. Save as `network-logs.har`
4. Can be imported later for analysis

### Method 3: Copy as cURL

1. Right-click on the request
2. Select "Copy" → "Copy as cURL"
3. Paste into terminal or text file

**Example cURL Output:**
```bash
curl 'https://xyz.supabase.co/rest/v1/properties?id=eq.123e4567' \
  -X POST \
  -H 'apikey: eyJhbGci...' \
  -H 'Authorization: Bearer eyJhbGci...' \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  --data-raw '{"status":"approved","approved_at":"2024-01-31T12:34:56.789Z",...}'
```

**Use Case:** Can replay the exact request in terminal

### Method 4: Screenshot

1. Expand all sections in Network tab
2. Press `PrtScn` or use screenshot tool
3. Capture Headers, Payload, and Response tabs
4. Save as `network-screenshot.png`

---

## JWT Token Analysis

### What is the JWT Token?

The JWT (JSON Web Token) in the `Authorization` header contains the user's identity and is verified by Supabase on every request.

### JWT Structure

A JWT has 3 parts separated by dots:
```
eyJhbGci...header...   .   eyJhdWQi...payload...   .   signature...
   HEADER                      PAYLOAD                     SIGNATURE
```

### Decoding JWT Payload

**Browser Console:**
```javascript
// Get current session
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Decode payload (base64)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT Payload:', payload);
```

**Example Payload:**
```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "sub": "987fcdeb-51a2-43f1-8a1b-123456789abc",
  "email": "admin@example.com",
  "email_confirmed_at": "2024-01-15T10:30:00.000Z",
  "phone": "",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "full_name": "Admin User"
  },
  "iat": 1706789456,
  "exp": 1706793056,
  "iss": "https://xyzhypbkcvdxlfnmqpoj.supabase.co/auth/v1"
}
```

**Key Fields:**

| Field | Description | Used For |
|-------|-------------|----------|
| `sub` | Subject (user ID) | Maps to `auth.uid()` in RLS policies |
| `email` | User's email | Identifying the user |
| `role` | User's role | Usually "authenticated" |
| `iat` | Issued At (Unix timestamp) | When token was created |
| `exp` | Expires At (Unix timestamp) | When token expires |

### Check Token Expiry

```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;
const payload = JSON.parse(atob(token.split('.')[1]));

const issuedAt = new Date(payload.iat * 1000);
const expiresAt = new Date(payload.exp * 1000);
const now = new Date();

console.log('Issued:', issuedAt.toLocaleString());
console.log('Expires:', expiresAt.toLocaleString());
console.log('Now:', now.toLocaleString());
console.log('Valid:', now < expiresAt ? '✅ YES' : '❌ EXPIRED');
```

**Typical Expiry:** 1 hour from issuance

### Verify JWT is Sent

**Check Network Tab:**
1. Go to Network tab
2. Click on the request
3. Go to "Headers" tab
4. Scroll to "Request Headers"
5. Look for `Authorization: Bearer eyJhbGci...`

**If Missing:**
- User is not logged in
- Session expired
- Supabase client not initialized

---

## Troubleshooting Guide

### Problem: Request Not Appearing in Network Tab

**Symptoms:**
- Click Approve/Reject
- No request appears in Network tab

**Possible Causes:**
1. JavaScript error before request is sent
2. Network tab filter hiding the request
3. Request was sent but very fast

**How to Fix:**
1. Clear Network tab filters (show All)
2. Check Console tab for errors
3. Try again with Network tab recording

---

### Problem: Request Shows "Pending" Forever

**Symptoms:**
- Request appears in Network tab
- Status shows "Pending"
- Never completes

**Possible Causes:**
1. Network connectivity issue
2. Supabase API down
3. CORS issue
4. Firewall blocking request

**How to Fix:**
1. Check internet connection
2. Visit status.supabase.com
3. Check browser console for CORS errors
4. Try in incognito mode

---

### Problem: Request Completes but Response is Empty

**Symptoms:**
- Status: 200 OK
- Response body: `[]` (empty array)

**Possible Causes:**
1. Property ID doesn't match any row
2. RLS blocked SELECT before UPDATE
3. Wrong filter parameter

**How to Fix:**
1. Verify property ID in URL query parameter
2. Check RLS policies
3. Try without RLS to test

---

### Problem: 403 Error but User is Admin

**Symptoms:**
- Error 403 Permission Denied
- User IS in admins table

**Possible Causes:**
1. Wrong JWT token (old session)
2. RLS policy not checking admins table correctly
3. Trigger using old admin check logic

**How to Fix:**
1. Re-login to get fresh token
2. Verify RLS policy SQL:
```sql
SELECT qual FROM pg_policies 
WHERE tablename = 'properties' 
AND policyname = 'properties_update_admin';
```
Should contain: `auth.uid() IN (SELECT user_id FROM public.admins)`

---

### Problem: Status Code is 0

**Symptoms:**
- Request shows in Network tab
- Status: (failed) or 0

**Possible Causes:**
1. CORS error
2. Request was blocked by browser
3. Network error

**How to Fix:**
1. Check Console for CORS error
2. Check Supabase CORS settings
3. Try in different browser

---

## Summary Checklist

Use this to verify network request is correct:

**Request Checklist:**
- [ ] Method is POST
- [ ] URL includes `id=eq.[property-uuid]`
- [ ] Content-Type is application/json
- [ ] Authorization header is present
- [ ] Authorization header starts with "Bearer "
- [ ] Request body is valid JSON
- [ ] Request body includes "status" field

**Response Checklist:**
- [ ] Status code is 200 OK
- [ ] Response body is an array
- [ ] Array contains 1 object
- [ ] Object has "status" field
- [ ] Status value matches what you sent

**Error Checklist:**
- [ ] Check error code (42501, PGRST301, etc.)
- [ ] Read error message carefully
- [ ] Check if user is admin
- [ ] Check if JWT is expired
- [ ] Verify request body format

---

## Additional Resources

### Supabase PostgREST API
- [PostgREST Documentation](https://postgrest.org/)
- [Supabase API Reference](https://supabase.com/docs/reference/javascript/update)

### HTTP Status Codes
- 200 OK - Success
- 204 No Content - Success (no body)
- 400 Bad Request - Invalid data
- 401 Unauthorized - Not logged in / expired token
- 403 Forbidden - RLS permission denied
- 406 Not Acceptable - No matching rows
- 409 Conflict - Constraint violation

---

**End of Network Documentation**
