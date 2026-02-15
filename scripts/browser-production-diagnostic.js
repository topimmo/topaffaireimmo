/**
 * PRODUCTION DIAGNOSTIC - Frontend Runtime Check
 * 
 * This script runs in the browser console to diagnose runtime issues
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Paste this entire file
 * 3. Run: await runProductionDiagnostic()
 */

async function runProductionDiagnostic() {
  console.log('%c🔍 PRODUCTION DIAGNOSTIC - TopAffaireImmo', 'font-size: 20px; font-weight: bold; color: #0FC2C0');
  console.log('Running comprehensive runtime diagnostic...\n');

  const results = [];
  
  function addResult(check, status, message, details = null) {
    results.push({ check, status, message, details });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'orange';
    console.log(`%c${icon} ${check}: ${message}`, `color: ${color}; font-weight: bold`);
    if (details) {
      console.log('  Details:', details);
    }
  }

  // PART 1: Environment Variables
  console.log('\n%c=== PART 1: Environment Variables ===', 'font-weight: bold; font-size: 16px');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    addResult('ENV_URL', 'FAIL', 'VITE_SUPABASE_URL not configured');
  } else {
    addResult('ENV_URL', 'PASS', 'VITE_SUPABASE_URL configured', { url: supabaseUrl });
  }
  
  if (!supabaseAnonKey) {
    addResult('ENV_KEY', 'FAIL', 'VITE_SUPABASE_ANON_KEY not configured');
  } else {
    addResult('ENV_KEY', 'PASS', 'VITE_SUPABASE_ANON_KEY configured', { keyPrefix: supabaseAnonKey.substring(0, 20) + '...' });
  }

  // PART 2: Supabase Client
  console.log('\n%c=== PART 2: Supabase Client ===', 'font-weight: bold; font-size: 16px');
  
  if (typeof window.supabase === 'undefined') {
    addResult('CLIENT', 'FAIL', 'Supabase client not available on window object', { note: 'Import supabase in your code' });
  } else {
    addResult('CLIENT', 'PASS', 'Supabase client available');
    
    // PART 3: Test artisan_profiles query
    console.log('\n%c=== PART 3: Database Query Test ===', 'font-weight: bold; font-size: 16px');
    
    try {
      const { data, error, count } = await window.supabase
        .from('artisan_profiles')
        .select('id, business_name, is_verified, is_active', { count: 'exact' })
        .limit(1);
      
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('schema cache')) {
          addResult('TABLE_QUERY', 'FAIL', 'Table artisan_profiles does not exist or schema cache error', { 
            error: error.message,
            code: error.code,
            hint: 'Run: npx supabase db push (or NOTIFY pgrst, \'reload schema\' in SQL editor)'
          });
        } else if (error.code === 'PGRST116') {
          addResult('TABLE_QUERY', 'FAIL', 'RLS is blocking access (no SELECT policy)', {
            error: error.message,
            hint: 'Check RLS policies in Supabase Dashboard'
          });
        } else {
          addResult('TABLE_QUERY', 'WARN', 'Query returned error', {
            error: error.message,
            code: error.code
          });
        }
      } else {
        addResult('TABLE_QUERY', 'PASS', 'Successfully queried artisan_profiles', {
          recordsReturned: data?.length || 0,
          totalCount: count
        });
      }
    } catch (err) {
      addResult('TABLE_QUERY', 'FAIL', 'Query threw exception', { error: err.message });
    }
    
    // PART 4: Test dependent tables
    console.log('\n%c=== PART 4: Dependent Tables ===', 'font-weight: bold; font-size: 16px');
    
    const dependentTables = ['service_categories', 'cities', 'artisan_services'];
    
    for (const table of dependentTables) {
      try {
        const { data, error } = await window.supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            addResult(`TABLE_${table}`, 'FAIL', `Table ${table} does not exist`, { error: error.message });
          } else {
            addResult(`TABLE_${table}`, 'WARN', `Table ${table} query failed (may be RLS)`, { error: error.message });
          }
        } else {
          addResult(`TABLE_${table}`, 'PASS', `Table ${table} accessible`, { records: data?.length || 0 });
        }
      } catch (err) {
        addResult(`TABLE_${table}`, 'FAIL', `Error querying ${table}`, { error: err.message });
      }
    }
    
    // PART 5: Storage buckets
    console.log('\n%c=== PART 5: Storage Buckets ===', 'font-weight: bold; font-size: 16px');
    
    try {
      const { data, error } = await window.supabase.storage.listBuckets();
      
      if (error) {
        addResult('STORAGE_LIST', 'FAIL', 'Could not list storage buckets', { error: error.message });
      } else {
        const buckets = data || [];
        const requiredBuckets = ['artisan-avatars', 'property-images'];
        const found = buckets.map(b => b.name);
        const missing = requiredBuckets.filter(rb => !found.includes(rb));
        
        if (missing.length > 0) {
          addResult('STORAGE_BUCKETS', 'FAIL', `Missing required buckets: ${missing.join(', ')}`, {
            found,
            missing
          });
        } else {
          addResult('STORAGE_BUCKETS', 'PASS', 'All required storage buckets exist', { buckets: found });
        }
      }
    } catch (err) {
      addResult('STORAGE_LIST', 'FAIL', 'Storage check threw exception', { error: err.message });
    }
    
    // PART 6: Auth state
    console.log('\n%c=== PART 6: Authentication State ===', 'font-weight: bold; font-size: 16px');
    
    try {
      const { data: { user }, error } = await window.supabase.auth.getUser();
      
      if (error) {
        addResult('AUTH_STATE', 'WARN', 'Could not get user state', { error: error.message });
      } else if (user) {
        addResult('AUTH_STATE', 'PASS', 'User is authenticated', {
          userId: user.id,
          email: user.email,
          role: user.role
        });
      } else {
        addResult('AUTH_STATE', 'PASS', 'User is not authenticated (anonymous)', {
          note: 'This is normal for public pages'
        });
      }
    } catch (err) {
      addResult('AUTH_STATE', 'FAIL', 'Auth check threw exception', { error: err.message });
    }
  }
  
  // PART 7: Network connectivity
  console.log('\n%c=== PART 7: Network Connectivity ===', 'font-weight: bold; font-size: 16px');
  
  if (navigator.onLine) {
    addResult('NETWORK', 'PASS', 'Browser is online');
  } else {
    addResult('NETWORK', 'FAIL', 'Browser is offline');
  }
  
  // Check if Supabase URL is reachable
  if (supabaseUrl) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey || '',
        }
      });
      
      if (response.ok || response.status === 404) {
        addResult('SUPABASE_REACHABLE', 'PASS', 'Supabase API is reachable', { status: response.status });
      } else {
        addResult('SUPABASE_REACHABLE', 'WARN', 'Supabase API returned unexpected status', { status: response.status });
      }
    } catch (err) {
      addResult('SUPABASE_REACHABLE', 'FAIL', 'Cannot reach Supabase API', { error: err.message });
    }
  }
  
  // PART 8: Console errors
  console.log('\n%c=== PART 8: Error Detection ===', 'font-weight: bold; font-size: 16px');
  
  addResult('ERROR_LOGGING', 'PASS', 'Check browser console for any red errors above', {
    note: 'Look for React errors, network errors, or database errors'
  });
  
  // Summary
  console.log('\n%c=== DIAGNOSTIC SUMMARY ===', 'font-weight: bold; font-size: 18px; color: #0FC2C0');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  
  console.log(`%cTotal Checks: ${results.length}`, 'font-weight: bold');
  console.log(`%c✅ Passed: ${passed}`, 'color: green; font-weight: bold');
  console.log(`%c❌ Failed: ${failed}`, 'color: red; font-weight: bold');
  console.log(`%c⚠️ Warnings: ${warnings}`, 'color: orange; font-weight: bold');
  
  // Critical issues
  const criticalIssues = results.filter(r => 
    r.status === 'FAIL' && 
    (r.check === 'TABLE_QUERY' || r.check === 'ENV_URL' || r.check === 'ENV_KEY')
  );
  
  if (criticalIssues.length > 0) {
    console.log('\n%c🚨 CRITICAL ISSUES FOUND:', 'font-size: 16px; font-weight: bold; color: red');
    criticalIssues.forEach(issue => {
      console.log(`%c❌ ${issue.check}: ${issue.message}`, 'color: red; font-weight: bold');
      if (issue.details?.hint) {
        console.log(`%c   💡 Fix: ${issue.details.hint}`, 'color: orange');
      }
    });
  } else {
    console.log('\n%c✅ All critical checks passed!', 'font-size: 16px; font-weight: bold; color: green');
  }
  
  // Return results for programmatic access
  return {
    summary: { total: results.length, passed, failed, warnings },
    results,
    criticalIssues,
    isHealthy: failed === 0 && criticalIssues.length === 0
  };
}

// Auto-detect if supabase is available
if (typeof window !== 'undefined') {
  console.log('%c📋 Production Diagnostic Script Loaded', 'font-weight: bold; color: #0FC2C0');
  console.log('Run: await runProductionDiagnostic()');
  
  // Make function globally available
  window.runProductionDiagnostic = runProductionDiagnostic;
} else {
  console.warn('This script must be run in a browser environment');
}
