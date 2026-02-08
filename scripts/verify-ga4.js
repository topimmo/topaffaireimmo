#!/usr/bin/env node
/**
 * GA4 Verification Script
 * 
 * This script helps verify that Google Analytics 4 is properly configured
 * in the production build. It checks for:
 * - Presence of GA4 script in index.html
 * - Correct measurement ID
 * - Proper initialization code
 * - Domain validation logic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Google Analytics 4 Verification\n');

// Check if dist/index.html exists
const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(distIndexPath)) {
  console.error('❌ dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

// Read the built index.html
const indexContent = fs.readFileSync(distIndexPath, 'utf-8');

// Checks
const checks = [
  {
    name: 'GA4 Script Present',
    test: () => indexContent.includes('Google Analytics 4'),
    fix: 'Add GA4 initialization script to index.html'
  },
  {
    name: 'Correct Measurement ID',
    test: () => indexContent.includes('G-TMY9XWWH6G'),
    fix: 'Update measurement ID in index.html and src/lib/analytics/ga4.ts'
  },
  {
    name: 'Domain Validation',
    test: () => indexContent.includes('topaffaireimmo.com'),
    fix: 'Add domain validation to GA4 initialization'
  },
  {
    name: 'gtag Function Initialization',
    test: () => indexContent.includes('function gtag()'),
    fix: 'Add gtag function definition in GA4 script'
  },
  {
    name: 'dataLayer Initialization',
    test: () => indexContent.includes('window.dataLayer'),
    fix: 'Add dataLayer initialization in GA4 script'
  },
  {
    name: 'gtag.js Script Injection',
    test: () => indexContent.includes('googletagmanager.com/gtag/js'),
    fix: 'Add script injection code to load gtag.js'
  },
  {
    name: 'Manual Page View Config',
    test: () => indexContent.includes('send_page_view') && indexContent.includes('false'),
    fix: 'Set send_page_view: false to prevent duplicate events in SPA'
  },
  {
    name: 'Secure Cookie Flags',
    test: () => indexContent.includes('SameSite=None;Secure'),
    fix: 'Add cookie_flags: "SameSite=None;Secure" to config'
  }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
  const result = check.test();
  if (result) {
    console.log(`✅ ${check.name}`);
    passed++;
  } else {
    console.log(`❌ ${check.name}`);
    console.log(`   Fix: ${check.fix}\n`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed}/${checks.length} checks passed\n`);

if (failed > 0) {
  console.error('❌ Some checks failed. Please review the fixes above.\n');
  process.exit(1);
}

console.log('✅ All GA4 configuration checks passed!\n');

// Additional information
console.log('📋 Next Steps:');
console.log('1. Deploy to production (topaffaireimmo.com or www.topaffaireimmo.com)');
console.log('2. Visit the site in a browser');
console.log('3. Open browser console and look for:');
console.log('   [GA4] Initialization started from index.html');
console.log('   [GA4] ✅ Page view tracked');
console.log('4. Check Network tab for:');
console.log('   - gtag/js?id=G-TMY9XWWH6G (Status: 200)');
console.log('   - g/collect requests (Status: 200)');
console.log('5. Verify in Google Analytics:');
console.log('   Reports → Realtime → should show active users\n');

console.log('💡 Tip: Use browser console command to manually test:');
console.log('   gtag("event", "test_event", { category: "diagnostic" });\n');

console.log('📖 For detailed verification guide, see: GA4_DIAGNOSTIC_REPORT.md\n');

process.exit(0);
