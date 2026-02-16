#!/usr/bin/env node
/**
 * PRODUCTION DIAGNOSTIC SCRIPT
 * 
 * This script connects to your Supabase production database and performs
 * comprehensive validation of the artisan_profiles table and related infrastructure.
 * 
 * Prerequisites:
 * - VITE_SUPABASE_URL in .env
 * - VITE_SUPABASE_ANON_KEY in .env
 * - SUPABASE_SERVICE_ROLE_KEY in .env (for admin queries)
 * 
 * Usage:
 * npm run diagnose:production
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bold + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

function section(title: string) {
  console.log('\n' + '-'.repeat(80));
  log(title, colors.bold + colors.blue);
  console.log('-'.repeat(80));
}

interface DiagnosticResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

function addResult(step: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ step, status, message, details });
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  log(`${icon} ${message}`, color);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function main() {
  header('🔍 PRODUCTION DIAGNOSTIC TOOL - TopAffaireImmo');
  
  log('This tool will verify your production Supabase setup.\n', colors.cyan);
  
  // Step 1: Environment Variables
  section('PART 1: Environment Variables Check');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !anonKey) {
    addResult(
      'ENV_CHECK',
      'FAIL',
      'Missing required environment variables',
      { supabaseUrl: !!supabaseUrl, anonKey: !!anonKey }
    );
    log('\n❌ CRITICAL: Cannot proceed without Supabase credentials', colors.red);
    log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env', colors.yellow);
    return;
  }
  
  addResult(
    'ENV_CHECK',
    'PASS',
    'Environment variables configured',
    { url: supabaseUrl.substring(0, 30) + '...', hasAnonKey: true, hasServiceRole: !!serviceRoleKey }
  );
  
  // Create clients
  const supabase = createClient(supabaseUrl, anonKey);
  const supabaseAdmin = serviceRoleKey 
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;
  
  if (!supabaseAdmin) {
    addResult(
      'ADMIN_CLIENT',
      'WARN',
      'Service role key not available - some checks will be limited',
      { note: 'Set SUPABASE_SERVICE_ROLE_KEY for full diagnostics' }
    );
  }
  
  // Step 2: Database Connection Test
  section('PART 2: Database Connection Test');
  
  try {
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
    // We expect this to fail, but it tests the connection
    if (error && error.message.includes('does not exist')) {
      addResult('DB_CONNECTION', 'PASS', 'Database connection successful');
    } else if (error) {
      addResult('DB_CONNECTION', 'WARN', 'Connection test returned unexpected error', { error: error.message });
    }
  } catch (err) {
    addResult('DB_CONNECTION', 'FAIL', 'Failed to connect to database', { error: String(err) });
  }
  
  // Step 3: Check if artisan_profiles table exists
  section('PART 3: Table Existence Check (artisan_profiles)');
  
  try {
    const { data, error } = await supabase
      .from('artisan_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('schema cache')) {
        addResult(
          'TABLE_EXISTS',
          'FAIL',
          'artisan_profiles table does NOT exist in production database',
          { error: error.message, code: error.code }
        );
        log('\n🚨 CRITICAL ISSUE FOUND:', colors.red);
        log('   The artisan_profiles table is missing from your production database.', colors.yellow);
        log('   You need to apply migration 089_create_monetization_tables.sql', colors.yellow);
        log('   Run: npx supabase db push', colors.cyan);
      } else {
        addResult(
          'TABLE_EXISTS',
          'WARN',
          'Table query returned error (may be RLS issue)',
          { error: error.message, code: error.code }
        );
      }
    } else {
      addResult(
        'TABLE_EXISTS',
        'PASS',
        'artisan_profiles table exists',
        { recordCount: data?.length || 0 }
      );
    }
  } catch (err) {
    addResult('TABLE_EXISTS', 'FAIL', 'Failed to query artisan_profiles', { error: String(err) });
  }
  
  // Step 4: List all public tables (using admin client if available)
  section('PART 4: List All Public Tables');
  
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_public_tables', {});
      
      if (error) {
        // Try alternative query
        log('RPC failed, trying direct query...', colors.yellow);
        
        const result = await supabaseAdmin
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
        
        if (result.error) {
          addResult('LIST_TABLES', 'WARN', 'Could not list tables', { error: result.error.message });
        } else {
          const tables = result.data || [];
          const hasArtisanProfiles = tables.some((t: any) => t.table_name === 'artisan_profiles');
          addResult(
            'LIST_TABLES',
            hasArtisanProfiles ? 'PASS' : 'FAIL',
            `Found ${tables.length} tables. artisan_profiles: ${hasArtisanProfiles ? 'YES' : 'NO'}`,
            { tables: tables.map((t: any) => t.table_name).slice(0, 20) }
          );
        }
      }
    } catch (err) {
      log('Cannot list tables without service role key', colors.yellow);
      addResult('LIST_TABLES', 'WARN', 'Requires service role key for this check');
    }
  } else {
    addResult('LIST_TABLES', 'WARN', 'Skipped - requires service role key');
  }
  
  // Step 5: Check RLS Status
  section('PART 5: RLS (Row Level Security) Check');
  
  try {
    // Try to query without auth - should work for public profiles
    const { data, error } = await supabase
      .from('artisan_profiles')
      .select('id, is_verified, is_active')
      .eq('is_verified', true)
      .eq('is_active', true)
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        addResult('RLS_CHECK', 'FAIL', 'Table does not exist', { error: error.message });
      } else if (error.code === 'PGRST116') {
        addResult('RLS_CHECK', 'FAIL', 'RLS is blocking all access (no SELECT policy for public)', { error: error.message });
      } else {
        addResult('RLS_CHECK', 'WARN', 'Query failed with unexpected error', { error: error.message, code: error.code });
      }
    } else {
      addResult('RLS_CHECK', 'PASS', 'RLS policies allow public SELECT for verified profiles', { records: data?.length || 0 });
    }
  } catch (err) {
    addResult('RLS_CHECK', 'FAIL', 'RLS check failed', { error: String(err) });
  }
  
  // Step 6: Check Storage Buckets
  section('PART 6: Storage Buckets Check');
  
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      addResult('STORAGE_BUCKETS', 'WARN', 'Could not list storage buckets', { error: error.message });
    } else {
      const buckets = data || [];
      const requiredBuckets = ['artisan-avatars', 'property-images', 'banner-images'];
      const missingBuckets = requiredBuckets.filter(
        rb => !buckets.some(b => b.id === rb || b.name === rb)
      );
      
      if (missingBuckets.length > 0) {
        addResult(
          'STORAGE_BUCKETS',
          'FAIL',
          `Missing required storage buckets: ${missingBuckets.join(', ')}`,
          { found: buckets.map(b => b.name), missing: missingBuckets }
        );
      } else {
        addResult(
          'STORAGE_BUCKETS',
          'PASS',
          'All required storage buckets exist',
          { buckets: buckets.map(b => b.name) }
        );
      }
    }
  } catch (err) {
    addResult('STORAGE_BUCKETS', 'FAIL', 'Storage check failed', { error: String(err) });
  }
  
  // Step 7: Check dependent tables
  section('PART 7: Dependent Tables Check');
  
  const dependentTables = ['service_categories', 'cities', 'artisan_services'];
  
  for (const table of dependentTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          addResult(
            `DEPENDENT_${table.toUpperCase()}`,
            'FAIL',
            `Table ${table} does not exist`,
            { error: error.message }
          );
        } else {
          addResult(
            `DEPENDENT_${table.toUpperCase()}`,
            'WARN',
            `Table ${table} query failed (may be RLS)`,
            { error: error.message }
          );
        }
      } else {
        addResult(
          `DEPENDENT_${table.toUpperCase()}`,
          'PASS',
          `Table ${table} exists`,
          { records: data?.length || 0 }
        );
      }
    } catch (err) {
      addResult(`DEPENDENT_${table.toUpperCase()}`, 'FAIL', `Check failed for ${table}`, { error: String(err) });
    }
  }
  
  // Step 8: Frontend URL Verification
  section('PART 8: Frontend URL Verification');
  
  log('Current VITE_SUPABASE_URL: ' + supabaseUrl, colors.cyan);
  log('Please verify this matches your Supabase project URL', colors.yellow);
  log('Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/api', colors.cyan);
  
  addResult(
    'URL_VERIFY',
    'WARN',
    'Manual verification required - check Supabase dashboard',
    { configuredUrl: supabaseUrl }
  );
  
  // Final Summary
  header('📊 DIAGNOSTIC SUMMARY');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  
  console.log(`Total Checks: ${results.length}`);
  log(`✅ Passed: ${passed}`, colors.green);
  log(`❌ Failed: ${failed}`, colors.red);
  log(`⚠️  Warnings: ${warnings}`, colors.yellow);
  
  // Critical Issues
  const criticalIssues = results.filter(r => 
    r.status === 'FAIL' && (
      r.step === 'TABLE_EXISTS' ||
      r.step === 'ENV_CHECK' ||
      r.step.startsWith('DEPENDENT_')
    )
  );
  
  if (criticalIssues.length > 0) {
    header('🚨 CRITICAL ISSUES FOUND');
    criticalIssues.forEach(issue => {
      log(`\n❌ ${issue.step}: ${issue.message}`, colors.red);
      if (issue.details) {
        console.log('   ', JSON.stringify(issue.details, null, 2));
      }
    });
    
    log('\n🔧 RECOMMENDED ACTIONS:', colors.bold + colors.yellow);
    
    if (criticalIssues.some(i => i.step === 'TABLE_EXISTS')) {
      log('\n1. Apply database migrations:', colors.cyan);
      log('   npx supabase db push', colors.green);
    }
    
    if (criticalIssues.some(i => i.step.startsWith('DEPENDENT_'))) {
      log('\n2. Ensure all migrations are applied (especially 089-114):', colors.cyan);
      log('   npx supabase db push', colors.green);
    }
    
    if (results.some(r => r.step === 'STORAGE_BUCKETS' && r.status === 'FAIL')) {
      log('\n3. Create missing storage buckets in Supabase Dashboard', colors.cyan);
    }
  } else {
    header('✅ ALL CRITICAL CHECKS PASSED');
    log('Your production database appears to be configured correctly!', colors.green);
    
    if (warnings > 0) {
      log('\nHowever, there are some warnings to review above.', colors.yellow);
    }
  }
  
  // Export results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `diagnostic-report-${timestamp}.json`;
  
  try {
    const fs = await import('fs');
    fs.writeFileSync(reportFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      supabaseUrl,
      results,
      summary: { passed, failed, warnings, total: results.length }
    }, null, 2));
    
    log(`\n📄 Full report saved to: ${reportFile}`, colors.cyan);
  } catch (err) {
    log('\nCould not save report file', colors.yellow);
  }
  
  // Return exit code based on failures
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  log('\n❌ FATAL ERROR:', colors.red);
  console.error(err);
  process.exit(1);
});
