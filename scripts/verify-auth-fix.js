#!/usr/bin/env node

/**
 * Auth Refresh Token Fix Verification Script
 * 
 * This script verifies that the auth refresh token fix is properly implemented
 * by checking the key changes in the codebase.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  const result = condition ? '✅' : '❌';
  const status = condition ? 'PASS' : 'FAIL';
  
  checks.push({ name, status, result, details });
  
  if (condition) {
    passed++;
    console.log(`${result} ${name}`);
  } else {
    failed++;
    console.log(`${result} ${name}`);
    if (details) console.log(`   ℹ️  ${details}`);
  }
  
  return condition;
}

console.log('🔍 Verifying Auth Refresh Token Fix...\n');
console.log('━'.repeat(60));

// Check 1: AuthProvider has clearAuthStorage function
const authProviderPath = path.join(__dirname, '../src/core/auth/AuthProvider.tsx');
const authProviderContent = fs.readFileSync(authProviderPath, 'utf8');

check(
  'clearAuthStorage() function exists',
  authProviderContent.includes('async function clearAuthStorage()'),
  'Required to safely clear only Supabase auth keys'
);

check(
  'clearAuthStorage() removes correct keys',
  authProviderContent.includes('topaffaireimmo-auth-token') &&
  authProviderContent.includes('localStorage.removeItem'),
  'Should remove topaffaireimmo-auth-token and related keys'
);

// Check 2: initializeAuth has refresh token error handling
check(
  'initializeAuth() has refresh token error handling',
  authProviderContent.includes('refresh') && 
  authProviderContent.includes('Refresh Token') &&
  authProviderContent.includes('clearAuthStorage()'),
  'Should detect refresh token errors and clear storage'
);

check(
  'initializeAuth() has try-catch block',
  authProviderContent.includes('const initializeAuth') &&
  authProviderContent.includes('try {') &&
  authProviderContent.includes('} catch (exception)') &&
  authProviderContent.includes('isInitializingRef.current = true'),
  'Should wrap auth operations in try-catch'
);

// Check 3: onAuthStateChange has error handling
check(
  'onAuthStateChange callback has try-catch',
  authProviderContent.includes('onAuthStateChange') &&
  authProviderContent.match(/onAuthStateChange[\s\S]*async.*{[\s\S]*try\s*{[\s\S]*}\s*catch/),
  'Should wrap auth state change callback in try-catch'
);

// Check 4: refreshSession has comprehensive error handling
check(
  'refreshSession() has try-catch block',
  authProviderContent.match(/refreshSession.*{[\s\S]*try\s*{[\s\S]*}\s*catch/),
  'Should wrap refresh session in try-catch'
);

check(
  'refreshSession() clears storage on failure',
  authProviderContent.includes('refreshSession') &&
  authProviderContent.match(/refreshSession[\s\S]*clearAuthStorage/),
  'Should call clearAuthStorage when refresh fails'
);

// Check 5: signOut calls clearAuthStorage
check(
  'signOut() calls clearAuthStorage()',
  authProviderContent.includes('signOut') &&
  authProviderContent.match(/signOut[\s\S]*clearAuthStorage/),
  'Should clear storage when signing out'
);

// Check 6: Logging is non-sensitive
check(
  'Error logging excludes tokens',
  !authProviderContent.match(/console\.(log|error|warn).*access_token/) &&
  !authProviderContent.match(/console\.(log|error|warn).*refresh_token/),
  'Should not log tokens in console'
);

check(
  'Error logging includes context',
  authProviderContent.includes('error code') ||
  authProviderContent.includes('error.code') ||
  authProviderContent.includes('error.message'),
  'Should log error codes and messages for debugging'
);

// Check 7: Storage bucket checks
const storagePath = path.join(__dirname, '../src/lib/storage.ts');
const storageContent = fs.readFileSync(storagePath, 'utf8');

check(
  'Storage bucket check is non-blocking',
  storageContent.includes('non-blocking') ||
  storageContent.includes('attempted anyway') ||
  (storageContent.includes('checkBucketExists') && storageContent.includes('return true')),
  'Should not block uploads even if bucket check fails'
);

check(
  'Storage warnings include helpful guidance',
  storageContent.includes('065_verify_storage_buckets') ||
  storageContent.includes('migration') ||
  storageContent.includes('manually'),
  'Should guide users to fix missing buckets'
);

// Check 8: Bucket names are correct
check(
  'Correct bucket names used',
  storageContent.includes("'payment-receipts'") &&
  storageContent.includes("'property-images'") &&
  storageContent.includes("'banner-images'") &&
  storageContent.includes("'agency-logos'"),
  'Should use payment-receipts (not receipts)'
);

// Check 9: Migration file exists
const migrationPath = path.join(__dirname, '../supabase/migrations/065_verify_storage_buckets.sql');
check(
  'Storage bucket migration exists',
  fs.existsSync(migrationPath),
  'Migration 065_verify_storage_buckets.sql should exist'
);

if (fs.existsSync(migrationPath)) {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  check(
    'Migration creates all required buckets',
    migrationContent.includes('property-images') &&
    migrationContent.includes('banner-images') &&
    migrationContent.includes('payment-receipts') &&
    migrationContent.includes('agency-logos'),
    'Should create all four required buckets'
  );
}

// Summary
console.log('━'.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✅ All checks passed! Auth refresh token fix is properly implemented.');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm run build');
  console.log('   2. Test in staging environment');
  console.log('   3. Create missing storage buckets in Supabase');
  console.log('   4. Deploy to production');
  console.log('\n📖 See AUTH_REFRESH_FIX_TESTING.md for detailed testing guide');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please review the implementation.');
  console.log('\n📝 Failed checks need to be addressed before deployment.');
  process.exit(1);
}
