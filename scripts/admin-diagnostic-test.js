/**
 * Admin Approve/Reject Diagnostic Test
 * 
 * Run this in the browser console (F12 → Console tab) while logged in as an admin
 * to diagnose issues with the approve/reject functionality.
 * 
 * Copy and paste the entire code block into the console and press Enter.
 */

(async function adminDiagnosticTest() {
  console.clear();
  console.log('%c========================================', 'color: blue; font-weight: bold');
  console.log('%cAdmin Approve/Reject Diagnostic Test', 'color: blue; font-weight: bold');
  console.log('%c========================================', 'color: blue; font-weight: bold');
  console.log('');

  const results = {
    authCheck: null,
    adminCheck: null,
    propertiesAccess: null,
    rlsPolicies: null,
    updateTest: null
  };

  // Test 1: Check Authentication
  console.group('📝 Test 1: Check Authentication');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Auth Error:', error);
      results.authCheck = { status: 'FAILED', error };
    } else if (!user) {
      console.warn('⚠️ No user logged in');
      results.authCheck = { status: 'NO_USER' };
    } else {
      console.log('✅ User authenticated');
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
      results.authCheck = { status: 'SUCCESS', userId: user.id, email: user.email };
    }
  } catch (err) {
    console.error('❌ Exception:', err);
    results.authCheck = { status: 'ERROR', error: err };
  }
  console.groupEnd();
  console.log('');

  if (!results.authCheck || results.authCheck.status !== 'SUCCESS') {
    console.error('%c❌ CRITICAL: User not authenticated. Please log in first.', 'color: red; font-weight: bold');
    return results;
  }

  const userId = results.authCheck.userId;

  // Test 2: Check Admin Status
  console.group('👑 Test 2: Check Admin Status');
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn('⚠️ User NOT in admins table');
        console.log('   Error Code:', error.code);
        console.log('   This means you are not an admin');
        results.adminCheck = { status: 'NOT_ADMIN', error };
      } else {
        console.error('❌ Admin Check Error:', error);
        console.log('   Error Code:', error.code);
        console.log('   Error Message:', error.message);
        results.adminCheck = { status: 'ERROR', error };
      }
    } else {
      console.log('✅ User IS an admin');
      console.log('   Admin Record:', data);
      results.adminCheck = { status: 'IS_ADMIN', data };
    }
  } catch (err) {
    console.error('❌ Exception:', err);
    results.adminCheck = { status: 'ERROR', error: err };
  }
  console.groupEnd();
  console.log('');

  // Test 3: Check Properties Table Access
  console.group('📋 Test 3: Check Properties Table Access');
  try {
    const { data, error, count } = await supabase
      .from('properties')
      .select('id, status', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      console.error('❌ Properties Access Error:', error);
      console.log('   Error Code:', error.code);
      console.log('   Error Message:', error.message);
      results.propertiesAccess = { status: 'FAILED', error };
    } else {
      console.log('✅ Can access properties table');
      console.log('   Total Properties:', count);
      console.log('   Sample (first 5):', data);
      results.propertiesAccess = { status: 'SUCCESS', count, sample: data };
    }
  } catch (err) {
    console.error('❌ Exception:', err);
    results.propertiesAccess = { status: 'ERROR', error: err };
  }
  console.groupEnd();
  console.log('');

  // Test 4: Check RLS Policies
  console.group('🔒 Test 4: Check RLS Policies (requires admin access to pg_policies)');
  try {
    const { data, error } = await supabase
      .rpc('get_policies_for_table', { table_name: 'properties' })
      .limit(10);

    if (error) {
      console.warn('⚠️ Cannot query policies (this is normal for non-superusers)');
      console.log('   Error:', error.message);
      results.rlsPolicies = { status: 'NO_ACCESS', error };
    } else {
      console.log('✅ RLS Policies:', data);
      results.rlsPolicies = { status: 'SUCCESS', policies: data };
    }
  } catch (err) {
    console.warn('⚠️ RLS query not available (normal)');
    results.rlsPolicies = { status: 'NO_ACCESS', error: err };
  }
  console.groupEnd();
  console.log('');

  // Test 5: Simulate Update Test (read-only check)
  console.group('🔧 Test 5: Simulate Property Update');
  try {
    // Find a pending property to test with
    const { data: pendingProps, error: findError } = await supabase
      .from('properties')
      .select('id, status, title_fr')
      .eq('status', 'pending')
      .limit(1);

    if (findError) {
      console.error('❌ Cannot find pending properties:', findError);
      results.updateTest = { status: 'NO_PENDING_PROPERTIES', error: findError };
    } else if (!pendingProps || pendingProps.length === 0) {
      console.log('⚠️ No pending properties found to test with');
      console.log('   Create a test property first, then re-run this diagnostic');
      results.updateTest = { status: 'NO_PENDING_PROPERTIES' };
    } else {
      const testProp = pendingProps[0];
      console.log('Found pending property:', testProp.id, '-', testProp.title_fr);
      console.log('');
      console.log('To manually test update, run:');
      console.log(`
  const testPropertyId = '${testProp.id}';
  const { data, error } = await supabase
    .from('properties')
    .update({ 
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: '${userId}',
      published_at: new Date().toISOString()
    })
    .eq('id', testPropertyId)
    .select();
  
  console.log('Update Result:', { data, error });
      `);
      results.updateTest = { status: 'READY', testProperty: testProp };
    }
  } catch (err) {
    console.error('❌ Exception:', err);
    results.updateTest = { status: 'ERROR', error: err };
  }
  console.groupEnd();
  console.log('');

  // Summary
  console.log('%c========================================', 'color: blue; font-weight: bold');
  console.log('%cDiagnostic Summary', 'color: blue; font-weight: bold');
  console.log('%c========================================', 'color: blue; font-weight: bold');
  console.log('');

  const summary = [];
  
  if (results.authCheck?.status === 'SUCCESS') {
    summary.push('✅ Authentication: Working');
  } else {
    summary.push('❌ Authentication: Failed');
  }

  if (results.adminCheck?.status === 'IS_ADMIN') {
    summary.push('✅ Admin Status: Confirmed');
  } else if (results.adminCheck?.status === 'NOT_ADMIN') {
    summary.push('❌ Admin Status: NOT AN ADMIN');
  } else {
    summary.push('❌ Admin Status: Error checking');
  }

  if (results.propertiesAccess?.status === 'SUCCESS') {
    summary.push('✅ Properties Access: Working');
  } else {
    summary.push('❌ Properties Access: Failed');
  }

  summary.forEach(line => console.log(line));
  console.log('');

  // Recommendations
  console.log('%cRecommendations:', 'color: orange; font-weight: bold');
  
  if (results.adminCheck?.status === 'NOT_ADMIN') {
    console.log('%c❌ CRITICAL: You are not an admin!', 'color: red; font-weight: bold');
    console.log('');
    console.log('To fix this, run the following SQL in Supabase SQL Editor:');
    console.log(`%cINSERT INTO public.admins (user_id) VALUES ('${userId}');`, 'background: #f0f0f0; padding: 5px; font-family: monospace');
    console.log('');
  } else if (results.adminCheck?.status === 'IS_ADMIN') {
    console.log('✅ Admin status confirmed. If approve/reject still fails:');
    console.log('   1. Check the console for error messages when clicking buttons');
    console.log('   2. Look for RLS policy errors (error code 42501)');
    console.log('   3. Verify the properties table has correct RLS policies');
    console.log('');
    console.log('Run the update test code shown above to test manually.');
  }

  console.log('');
  console.log('For more details, see ROOT_CAUSE_ANALYSIS_APPROVE_REJECT.md');
  console.log('');

  return results;
})();
