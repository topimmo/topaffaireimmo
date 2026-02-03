/**
 * Browser-based Diagnostic Tool for Property Listings
 * 
 * This file can be pasted into the browser console to diagnose
 * why property listings are not showing on the website.
 * 
 * Usage:
 * 1. Open the website in a browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Paste this entire file and press Enter
 * 5. The diagnostic will run automatically
 */

(async function runBrowserDiagnostics() {
  console.log('\n🔍 TopAffaireImmo Browser Diagnostics');
  console.log('='.repeat(80));
  
  // Check if window.supabase exists (from the app)
  // @ts-ignore
  const supabaseClient = window.supabase || (await import('@/lib/supabase')).supabase;
  
  if (!supabaseClient) {
    console.error('❌ Cannot find Supabase client');
    console.error('   This script must be run on a page where Supabase is loaded');
    return;
  }

  console.log('✅ Supabase client found\n');
  
  // 1. Check environment configuration
  console.log('📊 1. ENVIRONMENT CONFIGURATION\n');
  console.log('Current URL:', window.location.href);
  console.log('Origin:', window.location.origin);
  
  // Try to read env vars (only works in development)
  // @ts-ignore
  const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || 'configured';
  // @ts-ignore
  const supabaseKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY ? '✓ configured' : '✗ missing';
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseKey);
  console.log('');
  
  // 2. Test basic properties query
  console.log('📊 2. BASIC PROPERTIES QUERY (all properties)\n');
  
  const { data: allProps, error: allError, status: allStatus } = await supabaseClient
    .from('properties')
    .select('id, title_fr, status, is_archived')
    .limit(5);
  
  console.log(`Response Status: ${allStatus || 'N/A'}`);
  
  if (allError) {
    console.error('❌ Error:', allError);
    console.error('   Code:', allError.code);
    console.error('   Message:', allError.message);
    console.error('   Details:', allError.details);
    console.error('   Hint:', allError.hint);
  } else {
    console.log(`✅ Success: Fetched ${allProps?.length || 0} properties`);
    if (allProps && allProps.length > 0) {
      console.table(allProps);
    } else {
      console.warn('⚠️  No properties returned (table may be empty or RLS restricts access)');
    }
  }
  console.log('');
  
  // 3. Test published properties query (what users should see)
  console.log('📊 3. PUBLISHED PROPERTIES QUERY (public view)\n');
  
  const { data: pubProps, error: pubError } = await supabaseClient
    .from('properties')
    .select('id, title_fr, status, is_archived, created_at')
    .eq('status', 'published')
    .or('is_archived.is.null,is_archived.eq.false')
    .limit(10);
  
  if (pubError) {
    console.error('❌ Error:', pubError);
  } else {
    console.log(`✅ Found ${pubProps?.length || 0} published properties`);
    if (pubProps && pubProps.length > 0) {
      console.table(pubProps);
    } else {
      console.warn('⚠️  No published properties found!');
      console.warn('   Possible causes:');
      console.warn('   - Table is empty (need to seed data)');
      console.warn('   - All properties have status != "published"');
      console.warn('   - All properties have is_archived = true');
      console.warn('   - RLS policies prevent access');
    }
  }
  console.log('');
  
  // 4. Count properties by status (if we have service role access)
  console.log('📊 4. STATUS DISTRIBUTION (if accessible)\n');
  
  const { data: statusData, error: statusError } = await supabaseClient
    .from('properties')
    .select('status, is_archived');
  
  if (!statusError && statusData) {
    const statusCounts = statusData.reduce((acc, p) => {
      const key = `${p.status || 'NULL'} (archived: ${p.is_archived || 'NULL'})`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Status breakdown:');
    console.table(statusCounts);
  } else {
    console.log('⚠️  Cannot fetch all properties for status distribution');
    console.log('   This is normal if RLS policies restrict anon access');
  }
  console.log('');
  
  // 5. Test promo_banners
  console.log('📊 5. PROMO BANNERS CHECK\n');
  
  const { data: banners, error: bannersError } = await supabaseClient
    .from('promo_banners')
    .select('*')
    .limit(5);
  
  if (bannersError) {
    console.error('❌ Error fetching promo_banners:', bannersError.message);
    if (bannersError.code === '42P01' || bannersError.message.includes('does not exist')) {
      console.error('   💡 DIAGNOSIS: promo_banners table does not exist');
      console.error('   💡 FIX: Run migration 068_create_promo_banners.sql on Supabase');
    }
  } else {
    console.log(`✅ Promo banners table exists with ${banners?.length || 0} rows`);
    if (banners && banners.length > 0) {
      console.table(banners);
    }
  }
  console.log('');
  
  // 6. Test network request details
  console.log('📊 6. NETWORK REQUEST DIAGNOSTICS\n');
  console.log('To see actual HTTP requests:');
  console.log('1. Open Network tab in DevTools');
  console.log('2. Filter by "properties" or "rest/v1"');
  console.log('3. Look for status codes: 200 (good), 300 (ambiguous), 404 (not found), 403 (forbidden)');
  console.log('4. Check request headers: apikey, Authorization, Accept');
  console.log('5. Check response: Look for error messages or empty data arrays');
  console.log('');
  
  // 7. Final diagnosis
  console.log('📊 7. DIAGNOSIS SUMMARY\n');
  console.log('='.repeat(80));
  
  if (allError) {
    console.error('❌ CRITICAL: Cannot fetch properties at all');
    console.error('   Root cause: Database connection or permissions issue');
    console.error('   Next steps:');
    console.error('   1. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    console.error('   2. Check Supabase project is running');
    console.error('   3. Verify RLS policies allow anon SELECT');
  } else if (!pubProps || pubProps.length === 0) {
    console.warn('⚠️  WARNING: Can connect to DB but no published properties visible');
    console.warn('   Root cause: Data or status issue');
    console.warn('   Next steps:');
    console.warn('   1. Run: SELECT COUNT(*) FROM properties; (check if table is empty)');
    console.warn('   2. Run: SELECT status, COUNT(*) FROM properties GROUP BY status;');
    console.warn('   3. If empty: FORCE_SEED=true npm run seed:sample-listings');
    console.warn('   4. If wrong status: UPDATE properties SET status=\'published\' WHERE status=\'approved\';');
  } else {
    console.log('✅ SUCCESS: Database is working and has published properties');
    console.log(`   Found ${pubProps.length} properties available for display`);
    console.log('   If listings still not showing on the page:');
    console.log('   1. Check React component state/hooks');
    console.log('   2. Check for JavaScript errors in console');
    console.log('   3. Verify URL filters (city, type, etc)');
    console.log('   4. Check if properties match filter criteria');
  }
  
  console.log('='.repeat(80));
  console.log('Diagnostic complete!\n');
  
  // Return results for further inspection
  return {
    allProperties: allProps,
    publishedProperties: pubProps,
    banners: banners,
    errors: {
      all: allError,
      published: pubError,
      banners: bannersError
    }
  };
})();
