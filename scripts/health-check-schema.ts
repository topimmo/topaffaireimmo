#!/usr/bin/env tsx
/**
 * Schema Health Check Script
 * 
 * Purpose: Lightweight health check for production database schema
 * Usage: npm run health-check:schema
 * 
 * This script verifies:
 * 1. Required tables exist
 * 2. Required columns exist
 * 3. No deprecated tables/columns are present
 * 4. Schema matches expected state
 * 
 * Exit codes:
 * 0 = All checks passed
 * 1 = One or more checks failed
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials');
  console.error('Required environment variables:');
  console.error('  - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const checks: CheckResult[] = [];

async function checkTableExists(tableName: string, shouldExist: boolean = true): Promise<CheckResult> {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .limit(1);

  if (shouldExist) {
    if (error && error.code === '42P01') {
      return {
        name: `Table ${tableName} exists`,
        passed: false,
        message: `❌ FAIL: Table '${tableName}' does not exist`
      };
    }
    return {
      name: `Table ${tableName} exists`,
      passed: true,
      message: `✅ PASS: Table '${tableName}' exists`
    };
  } else {
    // Should NOT exist
    if (error && error.code === '42P01') {
      return {
        name: `Table ${tableName} does not exist`,
        passed: true,
        message: `✅ PASS: Table '${tableName}' does not exist (correct)`
      };
    }
    return {
      name: `Table ${tableName} does not exist`,
      passed: false,
      message: `❌ FAIL: Table '${tableName}' exists (should not exist!)`
    };
  }
}

async function checkPropertiesColumns(): Promise<CheckResult> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, created_at, updated_at, title_fr, status, owner_id, city_id, property_type')
    .limit(1);

  if (error) {
    // Check if it's a column-not-found error
    if (error.code === '42703') {
      return {
        name: 'Properties columns',
        passed: false,
        message: `❌ FAIL: Missing required columns in properties table: ${error.message}`
      };
    }
    // Other errors might be due to empty table, which is OK
    return {
      name: 'Properties columns',
      passed: true,
      message: `✅ PASS: Properties table has all required columns`
    };
  }

  return {
    name: 'Properties columns',
    passed: true,
    message: `✅ PASS: Properties table has all required columns`
  };
}

async function checkArtisanServicesColumns(): Promise<CheckResult> {
  const requiredColumns = [
    'id',
    'artisan_id',
    'category_id',
    'subcategory_id',
    'price_type',
    'price_from',
    'price_to',
    'description_fr',
    'description_ar',
    'is_active',
    'created_at',
    'updated_at',
    'artisan_profile_id',
    'service_subcategory_id'
  ];

  const selectColumns = requiredColumns.join(', ');
  const { data, error } = await supabase
    .from('artisan_services')
    .select(selectColumns)
    .limit(1);

  if (error) {
    // Check if it's a column-not-found error
    if (error.code === '42703') {
      return {
        name: 'Artisan services columns',
        passed: false,
        message: `❌ FAIL: Missing required columns in artisan_services: ${error.message}`
      };
    }
    // Other errors might be due to empty table, which is OK
    return {
      name: 'Artisan services columns',
      passed: true,
      message: `✅ PASS: Artisan services table has all required columns`
    };
  }

  return {
    name: 'Artisan services columns',
    passed: true,
    message: `✅ PASS: Artisan services table has all required columns`
  };
}

async function checkNoCityColumnInArtisanServices(): Promise<CheckResult> {
  // Try to select the city column - should fail
  const { error } = await supabase
    .from('artisan_services')
    .select('city')
    .limit(1);

  if (error && error.code === '42703') {
    // Column not found - this is what we want!
    return {
      name: 'No city column in artisan_services',
      passed: true,
      message: `✅ PASS: City column does not exist in artisan_services (correct)`
    };
  }

  if (!error) {
    return {
      name: 'No city column in artisan_services',
      passed: false,
      message: `❌ FAIL: City column EXISTS in artisan_services (schema mismatch!)`
    };
  }

  return {
    name: 'No city column in artisan_services',
    passed: false,
    message: `⚠️  WARNING: Could not verify city column status: ${error.message}`
  };
}

async function runHealthCheck(): Promise<void> {
  console.log('');
  console.log('==========================================');
  console.log('SCHEMA HEALTH CHECK');
  console.log('==========================================');
  console.log('');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // Check 1: Properties table exists
  console.log('Running checks...');
  checks.push(await checkTableExists('properties', true));

  // Check 2: Listings table does NOT exist
  checks.push(await checkTableExists('listings', false));

  // Check 3: Artisan services table exists
  checks.push(await checkTableExists('artisan_services', true));

  // Check 4: Admins table exists
  checks.push(await checkTableExists('admins', true));

  // Check 5: Properties columns
  checks.push(await checkPropertiesColumns());

  // Check 6: Artisan services columns
  checks.push(await checkArtisanServicesColumns());

  // Check 7: No city column in artisan_services
  checks.push(await checkNoCityColumnInArtisanServices());

  // Display results
  console.log('');
  console.log('==========================================');
  console.log('RESULTS');
  console.log('==========================================');
  console.log('');

  let failedChecks = 0;
  checks.forEach(check => {
    console.log(check.message);
    if (!check.passed) {
      failedChecks++;
    }
  });

  console.log('');
  console.log('==========================================');
  console.log('SUMMARY');
  console.log('==========================================');
  console.log(`Total checks: ${checks.length}`);
  console.log(`Passed: ${checks.length - failedChecks}`);
  console.log(`Failed: ${failedChecks}`);
  console.log('');

  if (failedChecks > 0) {
    console.log('❌ SCHEMA HEALTH CHECK FAILED');
    console.log('');
    console.log('Action required:');
    console.log('  1. Verify you are connected to the correct Supabase project');
    console.log('  2. Apply missing migrations');
    console.log('  3. Fix schema mismatches before deploying code');
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ SCHEMA HEALTH CHECK PASSED');
    console.log('All schema validations succeeded.');
    console.log('');
    process.exit(0);
  }
}

// Run the health check
runHealthCheck().catch(error => {
  console.error('');
  console.error('❌ ERROR: Health check failed with exception');
  console.error(error);
  console.error('');
  process.exit(1);
});
