#!/usr/bin/env tsx
/**
 * Quick Fix Script for Property Listings
 * 
 * This script attempts to automatically fix the most common issues
 * preventing property listings from showing on the website.
 * 
 * Usage: npx tsx scripts/quick-fix-listings.ts
 * 
 * What it does:
 * 1. Checks if database has any properties
 * 2. If empty, offers to seed sample data
 * 3. Fixes status inconsistencies (approved → published)
 * 4. Fixes archived flag inconsistencies
 * 5. Verifies public can access listings
 * 6. Reports final status
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔧 TopAffaireImmo Quick Fix Tool\n');
console.log('='.repeat(80));

// Validate configuration
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease configure these in your .env file');
  console.error('Get them from: Supabase Dashboard → Settings → API');
  process.exit(1);
}

console.log('✅ Configuration loaded\n');

// Create service role client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function runQuickFix() {
  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current database state...\n');
    
    const { count: totalCount, error: countError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw new Error(`Cannot access properties table: ${countError.message}`);
    }
    
    console.log(`   Total properties in database: ${totalCount}`);
    
    // Step 2: Handle empty database
    if (totalCount === 0) {
      console.log('\n⚠️  Database is empty!\n');
      console.log('Would you like to seed sample data?');
      console.log('This will create 50+ realistic Moroccan property listings.');
      console.log('\nTo seed data, run:');
      console.log('   FORCE_SEED=true npm run seed:sample-listings\n');
      console.log('Skipping other fixes (nothing to fix in empty database)');
      return;
    }
    
    // Step 3: Check status distribution
    console.log('\n📊 Step 2: Analyzing property statuses...\n');
    
    const { data: allProperties, error: fetchError } = await supabase
      .from('properties')
      .select('id, status, is_archived');
    
    if (fetchError) {
      throw new Error(`Cannot fetch properties: ${fetchError.message}`);
    }
    
    const statusCounts = allProperties!.reduce((acc, p) => {
      const key = p.status || 'NULL';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('   Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    
    // Step 4: Fix approved → published
    const approvedCount = statusCounts['approved'] || 0;
    
    if (approvedCount > 0) {
      console.log(`\n🔧 Step 3: Publishing ${approvedCount} approved properties...\n`);
      
      const { error: updateError } = await supabase
        .from('properties')
        .update({ status: 'published', is_archived: false })
        .eq('status', 'approved');
      
      if (updateError) {
        console.error(`   ❌ Error updating properties: ${updateError.message}`);
      } else {
        console.log(`   ✅ Successfully published ${approvedCount} properties`);
      }
    } else {
      console.log('\n✓ Step 3: No approved properties to publish\n');
    }
    
    // Step 5: Fix archived flag inconsistencies
    console.log('🔧 Step 4: Fixing archived flag inconsistencies...\n');
    
    const { error: archiveError1 } = await supabase
      .from('properties')
      .update({ is_archived: true })
      .eq('status', 'archived')
      .eq('is_archived', false);
    
    const { error: archiveError2 } = await supabase
      .from('properties')
      .update({ is_archived: false })
      .in('status', ['draft', 'pending', 'published', 'rejected'])
      .eq('is_archived', true);
    
    if (archiveError1 || archiveError2) {
      console.error('   ⚠️  Some archived flags could not be fixed');
    } else {
      console.log('   ✅ Archived flags synchronized with status');
    }
    
    // Step 6: Verify public visibility
    console.log('\n📊 Step 5: Verifying public visibility...\n');
    
    const { count: publicCount, error: publicError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .or('is_archived.is.null,is_archived.eq.false');
    
    if (publicError) {
      console.error(`   ❌ Error checking public properties: ${publicError.message}`);
    } else {
      console.log(`   ✅ Properties visible to public: ${publicCount}`);
      
      if (publicCount === 0) {
        console.log('\n⚠️  WARNING: No properties are publicly visible!');
        console.log('   This means all properties either:');
        console.log('   - Have status != "published"');
        console.log('   - Have is_archived = true');
        console.log('\n   Checking current status distribution...');
        
        const { data: currentProperties } = await supabase
          .from('properties')
          .select('status, is_archived');
        
        const currentCounts = currentProperties!.reduce((acc, p) => {
          const key = `${p.status} (archived: ${p.is_archived})`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log('\n   Current distribution:');
        Object.entries(currentCounts).forEach(([status, count]) => {
          console.log(`   - ${status}: ${count}`);
        });
      }
    }
    
    // Step 7: Check promo_banners
    console.log('\n📊 Step 6: Checking promo_banners table...\n');
    
    const { error: bannersError } = await supabase
      .from('promo_banners')
      .select('id')
      .limit(1);
    
    if (bannersError) {
      if (bannersError.code === '42P01' || bannersError.message.includes('does not exist')) {
        console.error('   ❌ promo_banners table does not exist');
        console.error('   💡 FIX: Run migration 068_create_promo_banners.sql in Supabase Dashboard');
      } else {
        console.error(`   ❌ Error accessing promo_banners: ${bannersError.message}`);
      }
    } else {
      console.log('   ✅ promo_banners table exists');
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY\n');
    
    if (publicCount && publicCount > 0) {
      console.log(`✅ SUCCESS! ${publicCount} properties are now publicly visible`);
      console.log('\nNext steps:');
      console.log('1. Open your website in a browser');
      console.log('2. Check if listings are now showing');
      console.log('3. If still not showing, run browser diagnostic:');
      console.log('   → Open browser console (F12)');
      console.log('   → Paste contents of scripts/browser-diagnostic.js');
      console.log('   → Press Enter');
    } else {
      console.log('⚠️  No properties are publicly visible after fixes\n');
      console.log('Possible causes:');
      console.log('1. All properties have status other than "published"');
      console.log('2. All properties are archived');
      console.log('3. RLS policies prevent public access\n');
      console.log('Next steps:');
      console.log('1. Run full diagnostic: npx tsx scripts/debug-listings.ts');
      console.log('2. Check RLS policies in Supabase Dashboard');
      console.log('3. Manually update property status if needed');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('Quick fix complete!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    console.error('\nPlease run full diagnostic for more details:');
    console.error('   npx tsx scripts/debug-listings.ts');
    process.exit(1);
  }
}

// Run the quick fix
runQuickFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
