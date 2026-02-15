#!/usr/bin/env node
/**
 * Frontend Supabase Diagnostic Script
 * Checks environment variables for Supabase configuration
 */

// Try to load .env file manually
const fs = require('fs');
const path = require('path');

// Simple .env parser
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (e) {
    // Ignore errors
  }
}

loadEnv();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

function pass(message) {
  log(`✓ ${message}`, colors.green);
}

function fail(message) {
  log(`✗ ${message}`, colors.red);
}

function warn(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function main() {
  header('FRONTEND SUPABASE DIAGNOSTIC');
  
  log('Checking environment variables...', colors.cyan);
  
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  
  let allGood = true;
  
  console.log('\nRequired Variables:');
  if (url && url !== 'https://YOUR_PROJECT_ID.supabase.co') {
    pass('VITE_SUPABASE_URL is set');
    info(`  ${url.substring(0, 40)}...`);
  } else {
    fail('VITE_SUPABASE_URL is missing or placeholder');
    allGood = false;
  }
  
  if (key && key !== 'your_supabase_anon_key_here') {
    pass('VITE_SUPABASE_ANON_KEY is set');
    info(`  ${key.substring(0, 30)}...`);
  } else {
    fail('VITE_SUPABASE_ANON_KEY is missing or placeholder');
    allGood = false;
  }
  
  console.log('\nSecurity Check:');
  if (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    fail('VITE_SUPABASE_SERVICE_ROLE_KEY should NOT be in frontend!');
    warn('Remove this immediately - security risk!');
    allGood = false;
  } else {
    pass('No service role key exposed (good!)');
  }
  
  if (allGood) {
    log('\n✓ Environment configured correctly!', colors.green);
    info('\nNext steps:');
    info('  1. Run: npm run dev');
    info('  2. Test authentication and features');
    info('  3. See docs/FRONTEND_SUPABASE_SETUP.md for details');
    process.exit(0);
  } else {
    log('\n✗ Configuration issues found!', colors.red);
    info('\nTo fix:');
    info('  1. Copy .env.example to .env');
    info('  2. Get credentials from Supabase Dashboard → Settings → API');
    info('  3. Update .env with your values');
    info('  4. Re-run: npm run diagnose:frontend');
    info('\nDetailed instructions: docs/FRONTEND_SUPABASE_SETUP.md');
    process.exit(1);
  }
}

main();
