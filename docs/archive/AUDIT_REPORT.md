# Supabase Setup Audit Report

## Issues Found

### 1. Missing Environment Variables Template
**Issue**: No `.env.example` file exists  
**Impact**: HIGH - Users don't know what environment variables are required  
**Root Cause**: Missing documentation template  
**Fix**: Created `.env.example` with required VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

### 2. Schema Mismatch - title_en Field
**Issue**: AddListing.tsx tries to set `title_en` field (line 242) but the schema in migration 020 only has `title_fr` and `title_ar`  
**Impact**: MEDIUM - May cause insert errors  
**Root Cause**: Migration 020_full_rebuild.sql doesn't include title_en column  
**Fix**: Need to either:
  - Add title_en column to migration, OR
  - Remove title_en from AddListing.tsx code

### 3. Phone Field Mismatch
**Issue**: AddListing.tsx sets `phone` field (line 249) but schema expects `contact_phone` (line 153 in migration 020)  
**Impact**: HIGH - Phone numbers not being saved correctly  
**Root Cause**: Field name mismatch between code and schema  
**Fix**: Change `phone` to `contact_phone` in AddListing.tsx

### 4. Missing is_admin Column in Base Schema
**Issue**: Migration 020_full_rebuild.sql (base schema) doesn't include is_admin column in profiles table, but RLS policies and functions use it  
**Impact**: HIGH - RLS policies will fail if migration 029/030 not applied  
**Root Cause**: is_admin added in later migrations (029, 030) but base schema missing it  
**Status**: Fixed in migration 029_admin_user_setup.sql which adds the column

### 5. Complex RLS Policies for INSERT
**Issue**: properties_insert_real_estate policy requires check_user_role() function which checks profiles table  
**Impact**: MEDIUM - New users may fail to insert if profile not created yet  
**Root Cause**: Race condition between auth user creation and profile creation  
**Fix**: Simplify INSERT policy to not require profile check initially

### 6. Profile Creation Trigger Incomplete
**Issue**: handle_new_user() function in migration 020 only sets id, email, and user_role. Missing full_name, phone, company_name  
**Impact**: LOW - Profile data may be incomplete after signup  
**Root Cause**: Trigger doesn't extract all metadata from auth.users.raw_user_meta_data  
**Status**: Fixed in migration 033_final_fixes.sql which properly extracts all fields

### 7. Missing title_en Field (Database)
**Issue**: Properties table schema lacks title_en column that the app code tries to use  
**Impact**: MEDIUM - English titles cannot be stored  
**Root Cause**: Schema evolution - migration 020 removed title_en that existed in migration 001  
**Fix**: Add title_en column back to properties table

### 8. Description Field Names
**Issue**: AddListing.tsx uses description_en but schema only has description_fr and description_ar  
**Impact**: MEDIUM - English descriptions cannot be stored  
**Root Cause**: Same as title_en - schema evolution issue  
**Fix**: Add description_en column or map to description_fr

## RLS Policy Analysis

### Profiles Table
✅ SELECT: Own profile or admin  
✅ UPDATE: Own profile or admin  
✅ INSERT: Own profile only  

### Properties Table
✅ SELECT: Approved properties (public) OR own properties OR admin  
⚠️ INSERT: Requires user_role check which may fail for new users  
✅ UPDATE: Owner or admin  
✅ DELETE: Owner or admin  

### Cities, Neighborhoods, Property Types
✅ Public read access (SELECT using true)  
✅ Admin can modify  

### Banner Requests
✅ Properly restricted to commercial advertisers  
✅ Admin oversight enabled  

### Storage Buckets
✅ Public read access  
✅ Authenticated users can upload  
✅ Proper policies in migration 033_final_fixes

## Authentication Flow Analysis

### Signup Flow
1. User calls supabase.auth.signUp() with email, password, and metadata
2. Supabase creates auth.users record with raw_user_meta_data
3. Trigger handle_new_user() creates profiles record
4. AuthContext.signUp() also calls supabase.from('profiles').upsert() 
⚠️ **Issue**: Double profile creation (trigger + manual upsert) - may cause conflicts

### Login Flow
✅ Uses supabase.auth.signInWithPassword()  
✅ Session managed properly with onAuthStateChange  
✅ Profile fetched after login  

### Session Persistence
✅ Supabase handles session automatically via localStorage  
✅ Auth state change listener properly updates context  

## Ad Publishing Flow Analysis

**Current Flow:**
1. User fills AddListing form
2. Form validation requires: propertyType, cityId
3. Data mapped to insert object
4. supabase.from('properties').insert() called
5. **FAILS** due to:
   - Field name mismatches (phone vs contact_phone, title_en)
   - Potentially RLS policy blocking inserts

**Root Causes:**
1. ❌ Field name mismatches
2. ❌ Missing title_en and description_en columns
3. ⚠️ RLS policy requires user_role which may not exist for new users

## Required Fixes (Priority Order)

### Critical (Blocks functionality)
1. ✅ Create .env.example file
2. Fix field name mismatches in AddListing.tsx (phone → contact_phone)
3. Add title_en and description_en columns to properties table
4. Simplify RLS INSERT policy to work for new users

### High (Improves reliability)
5. Remove duplicate profile creation (either trigger or manual upsert, not both)
6. Add better error handling in AddListing.tsx
7. Add logging for debugging

### Medium (Code quality)
8. Add JSDoc comments to critical functions
9. Improve validation messages
10. Add unit tests for auth flow

### Low (Nice to have)
11. Enable TypeScript strict mode
12. Add E2E tests
13. Performance optimization

## Testing Steps

### 1. Test Signup
```
1. Go to /register
2. Fill form with: email, password, full_name, phone, user_role
3. Click "S'inscrire"
4. Expected: Success message, redirect to /dashboard
5. Verify: Profile created in database with all fields
```

### 2. Test Login
```
1. Go to /login
2. Enter email and password
3. Click "Se connecter"
4. Expected: Redirect to /dashboard
5. Verify: User sees their listings
```

### 3. Test Add Listing
```
1. Login as real_estate_advertiser
2. Go to /add-listing
3. Fill required fields: property type, city, price
4. Click "Publier l'annonce"
5. Expected: Success message, redirect to /dashboard
6. Verify: Property created with status='pending'
```

## Security Considerations

✅ RLS enabled on all tables  
✅ Auth required for sensitive operations  
✅ Admin role properly protected  
⚠️ Anon key is safe for client-side (public read only)  
✅ Service role key not used in client code  

## Recommendations

1. **Use migration 020_full_rebuild.sql + subsequent fixes** (029, 030, 031, 033) as the canonical schema
2. **Add title_en and description_en** to match application expectations
3. **Simplify profile creation** - use trigger only, remove manual upsert
4. **Add comprehensive error logging** for production debugging
5. **Create integration tests** for critical paths (signup, login, publish ad)
6. **Document deployment process** with migration order
7. **Add health check endpoint** to verify Supabase connection
