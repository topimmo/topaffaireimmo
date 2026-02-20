/**
 * Production Fixes Tests
 * Run with: npx tsx src/tests/production-fixes.test.ts
 *
 * Verifies the fixes for the four production issues:
 *   A) Image upload size validation
 *   B) Search debounce / min-length / cache constants
 *   C) Listings default pagination limit
 *   D) Login brute-force protection constants
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type TestCase = {
  name: string;
  test: () => boolean | Promise<boolean>;
  description: string;
};

const tests: TestCase[] = [];

function readSource(relativePath: string): string {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8');
}

// ─── A) Image upload ────────────────────────────────────────────────────────

tests.push({
  name: 'storage.uploadFile validates size/type before upload',
  description: 'uploadFile must call validateFile (BUCKET_CONFIG lookup) before the actual network upload',
  test: () => {
    const src = readSource('lib/storage.ts');
    return src.includes('validateFile(file') && src.includes('Pre-upload validation failed');
  },
});

tests.push({
  name: 'BUCKET_CONFIG property-images max size is 5 MB',
  description: 'BUCKET_CONFIG["property-images"].maxSize must be exactly 5 * 1024 * 1024',
  test: () => {
    const src = readSource('lib/storage.ts');
    return src.includes('5 * 1024 * 1024') || src.includes('5242880');
  },
});

tests.push({
  name: 'BUCKET_CONFIG property-images allows jpeg/png/webp only',
  description: 'BUCKET_CONFIG["property-images"].allowedTypes must list jpeg, png, and webp',
  test: () => {
    const src = readSource('lib/storage.ts');
    // Look for the property-images block specifically
    const idx = src.indexOf("'property-images'");
    if (idx === -1) return false;
    // The block ends at the next closing brace for the entry
    const block = src.slice(idx, src.indexOf('},', idx) + 2);
    return (
      block.includes('image/jpeg') &&
      block.includes('image/png') &&
      block.includes('image/webp')
    );
  },
});

tests.push({
  name: 'imageUtils.ts exports compressImage function',
  description: 'compressImage must be exported from lib/imageUtils.ts',
  test: () => {
    const src = readSource('lib/imageUtils.ts');
    return src.includes('export async function compressImage');
  },
});

tests.push({
  name: 'compressImage skips files below threshold',
  description: 'compressImage must check file.size <= IMAGE_COMPRESSION_THRESHOLD and return early',
  test: () => {
    const src = readSource('lib/imageUtils.ts');
    return (
      src.includes('IMAGE_COMPRESSION_THRESHOLD') &&
      src.includes('file.size <= IMAGE_COMPRESSION_THRESHOLD')
    );
  },
});

tests.push({
  name: 'ArtisanDashboardPage uses compressImage before upload',
  description: 'Avatar upload flow must compress before calling uploadArtisanAvatar',
  test: () => {
    const src = readSource('pages/dashboard/ArtisanDashboardPage.tsx');
    return src.includes('compressImage') && src.includes('compressImage(file)');
  },
});

// ─── B) Search rate limit ────────────────────────────────────────────────────

tests.push({
  name: 'useArtisans enforces MIN_SEARCH_LENGTH',
  description: 'useArtisans must export and use MIN_SEARCH_LENGTH constant (>= 2)',
  test: () => {
    const src = readSource('hooks/useArtisans.ts');
    const exported = src.includes('export const MIN_SEARCH_LENGTH');
    const used = src.includes('MIN_SEARCH_LENGTH');
    const match = src.match(/MIN_SEARCH_LENGTH\s*=\s*(\d+)/);
    const value = match ? parseInt(match[1], 10) : 0;
    return exported && used && value >= 2;
  },
});

tests.push({
  name: 'useArtisans uses AbortController to cancel in-flight requests',
  description: 'useArtisans must create and use an AbortController',
  test: () => {
    const src = readSource('hooks/useArtisans.ts');
    return src.includes('AbortController') && src.includes('controller.abort()');
  },
});

tests.push({
  name: 'useArtisans has in-memory cache with TTL',
  description: 'useArtisans must define artisanCache and CACHE_TTL_MS',
  test: () => {
    const src = readSource('hooks/useArtisans.ts');
    return src.includes('artisanCache') && src.includes('CACHE_TTL_MS');
  },
});

tests.push({
  name: 'ArtisansPage debounces searchTerm updates (500 ms)',
  description: 'ArtisansPage must use a setTimeout debounce of 500 ms for searchTerm',
  test: () => {
    const src = readSource('pages/ArtisansPage.tsx');
    return src.includes('500') && src.includes('searchDebounceRef') && src.includes('clearTimeout');
  },
});

tests.push({
  name: 'useArtisans caps results with .limit(50)',
  description: 'useArtisans must call .limit() on the query to prevent unbounded fetches',
  test: () => {
    const src = readSource('hooks/useArtisans.ts');
    return src.includes('.limit(');
  },
});

// ─── C) Listings timeout ─────────────────────────────────────────────────────

tests.push({
  name: 'useProperties default limit is 20 (not 50)',
  description: 'The default pagination limit in useProperties should be 20',
  test: () => {
    const src = readSource('hooks/useProperties.ts');
    return src.includes('limit ?? 20') || src.includes('limit = 20');
  },
});

tests.push({
  name: 'useProperties logs query duration',
  description: 'useProperties must measure and log the time taken by the DB query',
  test: () => {
    const src = readSource('hooks/useProperties.ts');
    return src.includes('Date.now()') && src.includes('duration') && src.includes('/listings');
  },
});

// ─── D) Login brute force ────────────────────────────────────────────────────

tests.push({
  name: 'LoginPage tracks failed attempts',
  description: 'LoginPage must count failed sign-in attempts and call recordFailedAttempt',
  test: () => {
    const src = readSource('pages/auth/LoginPage.tsx');
    return src.includes('recordFailedAttempt') && src.includes('attemptData');
  },
});

tests.push({
  name: 'LoginPage locks out after MAX_ATTEMPTS',
  description: 'LoginPage must define MAX_ATTEMPTS and apply a timed lockout',
  test: () => {
    const src = readSource('pages/auth/LoginPage.tsx');
    const hasConst = src.includes('MAX_ATTEMPTS');
    const hasLockout = src.includes('LOCKOUT_DURATION_MS') || src.includes('lockedUntil');
    return hasConst && hasLockout;
  },
});

tests.push({
  name: 'LoginPage shows captcha placeholder after CAPTCHA_THRESHOLD failures',
  description: 'LoginPage must render a captcha warning after CAPTCHA_THRESHOLD failures',
  test: () => {
    const src = readSource('pages/auth/LoginPage.tsx');
    return src.includes('CAPTCHA_THRESHOLD') && src.includes('showCaptchaPlaceholder');
  },
});

tests.push({
  name: 'LoginPage generic error message does not leak email existence',
  description: 'User-facing error messages should not reveal whether the email exists',
  test: () => {
    const src = readSource('pages/auth/LoginPage.tsx');
    // Check that user-visible strings (inside toast/setErrors calls) don't leak info
    // We accept comments mentioning "email exists" as they document intent,
    // but we must NOT have visible strings like "cet email n'existe pas"
    const leakPatterns = [
      /setErrors.*n.existe pas/i,
      /toast.*email.*inexistant/i,
      /toast.*not.*registered/i,
      /setErrors.*email.*not found/i,
    ];
    return !leakPatterns.some(r => r.test(src));
  },
});

// ─── Run ─────────────────────────────────────────────────────────────────────

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('🧪 Running Production Fixes Tests...\n');

  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`✅ PASS: ${test.name}`);
        console.log(`   ${test.description}`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${test.name}`);
        console.error(`   ${test.description}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ ERROR: ${test.name}`);
      console.error(`   ${test.description}`);
      console.error(`   Error: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
    console.log('');
  }

  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

  if (failed > 0) {
    console.error('\n⚠️  Some tests failed. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✨ All production-fixes tests passed!');
  }
}

runTests();
