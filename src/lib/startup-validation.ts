/**
 * Startup Validation Utility
 * Validates configuration and environment at application startup
 */

import { supabase, isSupabaseConfigured } from './supabase'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate required environment variables
 */
function validateEnvironmentVariables(): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Critical environment variables
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is not set')
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is not set')
  }
  
  // Important but not critical
  if (!import.meta.env.VITE_PRODUCTION_DOMAIN) {
    warnings.push('VITE_PRODUCTION_DOMAIN is not set - email confirmations may use incorrect redirect URLs')
  }
  
  // Validate URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    warnings.push('VITE_SUPABASE_URL should use HTTPS protocol')
  }
  
  return { errors, warnings }
}

/**
 * Test database connectivity
 */
async function testDatabaseConnectivity(): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!isSupabaseConfigured) {
    errors.push('Supabase not configured - cannot test database connectivity')
    return { errors, warnings }
  }
  
  try {
    // Simple connectivity test using a basic query that doesn't depend on RLS
    // This just checks if we can communicate with the database
    const { error } = await supabase.rpc('current_user')
    
    if (error) {
      // If RPC fails, try a simple table query as fallback
      const { error: tableError } = await supabase.from('profiles').select('id').limit(0)
      
      if (tableError && tableError.code !== 'PGRST116') {
        errors.push(`Database connectivity test failed: ${tableError.message}`)
      } else {
        console.log('✅ Database connectivity test passed')
      }
    } else {
      console.log('✅ Database connectivity test passed')
    }
  } catch (exception) {
    errors.push(`Database connectivity exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`)
  }
  
  return { errors, warnings }
}

/**
 * Validate storage bucket configuration
 */
async function validateStorageBuckets(): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!isSupabaseConfigured) {
    errors.push('Supabase not configured - cannot validate storage buckets')
    return { errors, warnings }
  }
  
  const requiredBuckets = [
    'property-images',
    'banner-images',
    'payment-receipts',
    'agency-logos'
  ]
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      warnings.push(`Could not list storage buckets: ${error.message}`)
      return { errors, warnings }
    }
    
    const bucketNames = buckets?.map(b => b.name) || []
    
    for (const bucketName of requiredBuckets) {
      if (!bucketNames.includes(bucketName)) {
        warnings.push(`Storage bucket '${bucketName}' not found - image upload may fail`)
      }
    }
    
    if (bucketNames.length > 0) {
      console.log(`✅ Found ${bucketNames.length} storage bucket(s):`, bucketNames.join(', '))
    }
  } catch (exception) {
    warnings.push(`Storage bucket validation exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`)
  }
  
  return { errors, warnings }
}

/**
 * Validate authentication configuration
 */
function validateAuthConfiguration(): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!isSupabaseConfigured) {
    errors.push('Supabase not configured - authentication will not work')
    return { errors, warnings }
  }
  
  // Check session storage
  if (typeof window !== 'undefined' && !window.localStorage) {
    errors.push('localStorage not available - session persistence will fail')
  }
  
  return { errors, warnings }
}

/**
 * Run all startup validations
 */
export async function runStartupValidation(): Promise<ValidationResult> {
  console.log('🔍 Running startup validation...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const allErrors: string[] = []
  const allWarnings: string[] = []
  
  // 1. Validate environment variables
  console.log('1️⃣ Validating environment variables...')
  const envResult = validateEnvironmentVariables()
  allErrors.push(...envResult.errors)
  allWarnings.push(...envResult.warnings)
  
  if (envResult.errors.length === 0) {
    console.log('   ✅ Environment variables valid')
  } else {
    console.error('   ❌ Environment variable errors:', envResult.errors)
  }
  
  if (envResult.warnings.length > 0) {
    console.warn('   ⚠️ Environment variable warnings:', envResult.warnings)
  }
  
  // 2. Validate auth configuration
  console.log('2️⃣ Validating authentication configuration...')
  const authResult = validateAuthConfiguration()
  allErrors.push(...authResult.errors)
  allWarnings.push(...authResult.warnings)
  
  if (authResult.errors.length === 0) {
    console.log('   ✅ Authentication configuration valid')
  } else {
    console.error('   ❌ Authentication configuration errors:', authResult.errors)
  }
  
  // 3. Test database connectivity (async)
  console.log('3️⃣ Testing database connectivity...')
  const dbResult = await testDatabaseConnectivity()
  allErrors.push(...dbResult.errors)
  allWarnings.push(...dbResult.warnings)
  
  if (dbResult.errors.length === 0) {
    console.log('   ✅ Database connectivity OK')
  } else {
    console.error('   ❌ Database connectivity errors:', dbResult.errors)
  }
  
  // 4. Validate storage buckets (async)
  console.log('4️⃣ Validating storage buckets...')
  const storageResult = await validateStorageBuckets()
  allErrors.push(...storageResult.errors)
  allWarnings.push(...storageResult.warnings)
  
  if (storageResult.errors.length === 0 && storageResult.warnings.length === 0) {
    console.log('   ✅ Storage buckets configured')
  } else if (storageResult.warnings.length > 0) {
    console.warn('   ⚠️ Storage bucket warnings:', storageResult.warnings)
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const valid = allErrors.length === 0
  
  if (valid) {
    console.log('✅ STARTUP VALIDATION PASSED')
    if (allWarnings.length > 0) {
      console.warn(`⚠️ ${allWarnings.length} warning(s) found:`)
      allWarnings.forEach(w => console.warn(`   - ${w}`))
    }
  } else {
    console.error('❌ STARTUP VALIDATION FAILED')
    console.error(`   ${allErrors.length} error(s) found:`)
    allErrors.forEach(e => console.error(`   - ${e}`))
    
    if (allWarnings.length > 0) {
      console.warn(`   ${allWarnings.length} warning(s) found:`)
      allWarnings.forEach(w => console.warn(`   - ${w}`))
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  return {
    valid,
    errors: allErrors,
    warnings: allWarnings
  }
}

/**
 * Run startup validation and show user-friendly error if critical issues found
 */
export async function validateAndInitialize(): Promise<boolean> {
  const result = await runStartupValidation()
  
  if (!result.valid) {
    // Critical errors found - show error to user
    console.error('⛔ Application cannot start due to configuration errors')
    
    // In production, you might want to show a modal or error page
    if (import.meta.env.PROD) {
      console.error('Please check your environment variables and Supabase configuration')
    }
    
    return false
  }
  
  return true
}
