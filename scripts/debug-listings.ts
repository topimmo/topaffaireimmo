#!/usr/bin/env tsx
/**
 * Debug Property Listings Diagnostic Script
 * 
 * Purpose: Investigate why property listings are not showing on TopAffaireImmo
 * 
 * Symptoms:
 * - HTTP 300 on /rest/v1/properties
 * - HTTP 404 on /rest/v1/promo_banners  
 * - Empty properties table
 * - UPDATE...LIMIT syntax errors
 * 
 * Usage: npx tsx scripts/debug-listings.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('\n🔍 TopAffaireImmo Listings Diagnostic Tool\n');
console.log('=' .repeat(80));

// Validate configuration
if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_URL environment variable');
  process.exit(1);
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  console.error('❌ Missing both SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_ANON_KEY');
  console.error('   At least one key is required to run diagnostics');
  process.exit(1);
}

console.log('✅ Configuration loaded:');
console.log(`   - Supabase URL: ${supabaseUrl.substring(0, 40)}...`);
console.log(`   - Service Key: ${supabaseServiceKey ? '✓ Available' : '✗ Not available'}`);
console.log(`   - Anon Key: ${supabaseAnonKey ? '✓ Available' : '✗ Not available'}`);
console.log('=' .repeat(80));

// Create Supabase clients
const serviceClient = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const anonClient = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

async function runDiagnostics() {
  console.log('\n📊 A) VERIFY DATABASE CONTAINS LISTINGS\n');
  
  if (!serviceClient) {
    console.log('⚠️  Skipping service-role queries (no service key provided)');
  } else {
    // 1. Total count
    const { count: totalCount, error: countError } = await serviceClient
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error(`❌ Error counting properties: ${countError.message}`);
    } else {
      console.log(`1. Total properties: ${totalCount}`);
    }

    // 2. Count by status
    const { data: statusData, error: statusError } = await serviceClient
      .from('properties')
      .select('status');
    
    if (statusError) {
      console.error(`❌ Error fetching status data: ${statusError.message}`);
    } else {
      const statusCounts: Record<string, number> = {};
      statusData?.forEach(p => {
        const status = p.status || 'NULL';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log('\n2. Properties by status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
    }

    // 3. Count by is_archived
    const { data: archivedData, error: archivedError } = await serviceClient
      .from('properties')
      .select('is_archived');
    
    if (archivedError) {
      console.error(`❌ Error fetching archived data: ${archivedError.message}`);
    } else {
      const archivedCounts: Record<string, number> = {};
      archivedData?.forEach(p => {
        const archived = p.is_archived === null ? 'NULL' : String(p.is_archived);
        archivedCounts[archived] = (archivedCounts[archived] || 0) + 1;
      });
      console.log('\n3. Properties by is_archived:');
      Object.entries(archivedCounts).forEach(([archived, count]) => {
        console.log(`   - ${archived}: ${count}`);
      });
    }

    // 4. Publicly visible count
    const { count: publicCount, error: publicError } = await serviceClient
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .or('is_archived.is.null,is_archived.eq.false');
    
    if (publicError) {
      console.error(`❌ Error counting public properties: ${publicError.message}`);
    } else {
      console.log(`\n4. Publicly visible properties (status=published, is_archived=false): ${publicCount}`);
    }
  }

  console.log('\n📊 B) TEST API CALLS (ANON USER)\n');
  
  if (!anonClient) {
    console.log('⚠️  Skipping anon client tests (no anon key provided)');
  } else {
    // Test 1: Fetch all properties as anon user
    console.log('5. Testing GET /rest/v1/properties (anon client):');
    const { data: anonData, error: anonError, status: anonStatus } = await anonClient
      .from('properties')
      .select('id, title_fr, status, is_archived')
      .limit(5);
    
    console.log(`   - HTTP Status: ${anonStatus || 'N/A'}`);
    if (anonError) {
      console.error(`   - ❌ Error: ${anonError.message}`);
      console.error(`   - Error details:`, anonError);
    } else {
      console.log(`   - ✅ Success: Fetched ${anonData?.length || 0} properties`);
      if (anonData && anonData.length > 0) {
        console.log('   - Sample properties:');
        anonData.forEach((p, i) => {
          console.log(`     ${i+1}. ${p.title_fr || 'No title'} (status: ${p.status}, archived: ${p.is_archived})`);
        });
      }
    }

    // Test 2: Fetch published properties only
    console.log('\n6. Testing GET /rest/v1/properties?status=eq.published:');
    const { data: publishedData, error: publishedError } = await anonClient
      .from('properties')
      .select('id, title_fr, status, is_archived')
      .eq('status', 'published')
      .limit(5);
    
    if (publishedError) {
      console.error(`   - ❌ Error: ${publishedError.message}`);
    } else {
      console.log(`   - ✅ Success: Fetched ${publishedData?.length || 0} published properties`);
    }

    // Test 3: Check promo_banners
    console.log('\n7. Testing GET /rest/v1/promo_banners (anon client):');
    const { data: bannersData, error: bannersError } = await anonClient
      .from('promo_banners')
      .select('*');
    
    if (bannersError) {
      console.error(`   - ❌ Error: ${bannersError.message}`);
      if (bannersError.message.includes('does not exist') || bannersError.code === '42P01') {
        console.error(`   - ⚠️  DIAGNOSIS: promo_banners table does not exist in database`);
        console.error(`   - 💡 FIX: Run migration 068_create_promo_banners.sql`);
      }
    } else {
      console.log(`   - ✅ Success: Fetched ${bannersData?.length || 0} promo banners`);
    }
  }

  console.log('\n📊 C) CHECK RLS POLICIES\n');
  
  if (!serviceClient) {
    console.log('⚠️  Skipping RLS policy checks (no service key provided)');
  } else {
    // Query pg_policies
    const { data: policiesData, error: policiesError } = await serviceClient
      .rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            cmd,
            permissive,
            qual,
            with_check
          FROM pg_policies 
          WHERE schemaname = 'public' AND tablename = 'properties'
          ORDER BY cmd, policyname
        `
      });
    
    if (policiesError) {
      // If RPC doesn't exist, try direct query
      console.log('8. RLS Policies on properties table:');
      console.log('   ⚠️  Cannot query pg_policies via RPC (need service role direct DB access)');
      console.log('   💡 Run diagnostic SQL script to check policies manually');
    } else {
      console.log('8. RLS Policies on properties table:');
      if (policiesData && policiesData.length > 0) {
        console.log(`   - Found ${policiesData.length} policies`);
        policiesData.forEach((policy: any) => {
          console.log(`   - ${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log('   - No policies found (this may cause issues!)');
      }
    }
  }

  console.log('\n📊 D) DIAGNOSIS & RECOMMENDATIONS\n');
  console.log('=' .repeat(80));
  
  // Determine root cause
  if (anonClient) {
    const { count } = await anonClient
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    if (count === 0) {
      console.log('❌ ROOT CAUSE: No properties visible to anonymous users\n');
      console.log('Possible reasons:');
      console.log('  1. Properties table is empty (need to seed data)');
      console.log('  2. RLS policies are too restrictive (check SELECT policies)');
      console.log('  3. All properties have wrong status (should be "published")');
      console.log('  4. All properties are archived (is_archived = true)');
      
      console.log('\n💡 RECOMMENDED FIXES:\n');
      console.log('  A. If table is empty:');
      console.log('     → Run: FORCE_SEED=true npm run seed:sample-listings');
      console.log('');
      console.log('  B. If properties exist but wrong status:');
      console.log('     → Run SQL: UPDATE properties SET status=\'published\', is_archived=FALSE WHERE status!=\'archived\';');
      console.log('');
      console.log('  C. If RLS policies missing:');
      console.log('     → Run migration: supabase/migrations/072_fix_properties_rls_policies.sql');
    } else {
      console.log(`✅ Found ${count} properties visible to anonymous users`);
      console.log('\nIf listings still not showing on frontend:');
      console.log('  1. Check browser console for errors');
      console.log('  2. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
      console.log('  3. Check network tab for failed API requests');
      console.log('  4. Review useProperties hook filtering logic');
    }
  }

  console.log('\n' + '=' .repeat(80));
  console.log('Diagnostic complete!\n');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('\n❌ Fatal error running diagnostics:', error);
  process.exit(1);
});
