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
 * CRITICAL: This should warn but not block app startup
 * Database issues should be handled gracefully at runtime
 */
async function testDatabaseConnectivity(): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!isSupabaseConfigured) {
    // Not a critical error - app can handle this at runtime
    console.log('ℹ️ Skipping database connectivity test (Supabase not configured)')
    return { errors, warnings }
  }
  
  try {
    // Simple connectivity test using a basic query that doesn't depend on RLS
    // This just checks if we can communicate with the database
    const { error } = await supabase.from('cities').select('id').limit(1)
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for connectivity test
      // Don't treat as error - app can handle DB issues at runtime
      warnings.push(`Database connectivity issue: ${error.message}`)
      console.warn('⚠️ Database connectivity test failed (non-blocking):', error.message)
    } else {
      console.log('✅ Database connectivity test passed')
    }
  } catch (exception) {
    // CRITICAL: Never let DB connectivity test crash the app
    warnings.push(`Database connectivity exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`)
    console.warn('⚠️ Database connectivity exception (non-blocking):', exception)
  }
  
  return { errors, warnings }
}

/**
 * Validate storage bucket configuration
 * CRITICAL: This should NEVER add errors, only warnings
 * Storage bucket issues should not prevent app from starting
 */
async function validateStorageBuckets(): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!isSupabaseConfigured) {
    // Not an error - just skip validation silently
    console.log('ℹ️ Skipping storage bucket validation (Supabase not configured)')
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
      // If we can't list buckets due to permissions, that's OK - just skip validation
      // This prevents noisy warnings when buckets exist but user lacks list permission
      console.log(`ℹ️ Could not list storage buckets (may be due to permissions): ${error.message}`)
      return { errors, warnings }
    }
    
    const bucketNames = buckets?.map(b => b.name) || []
    
    // Only warn if we successfully listed buckets but some are missing
    const missingBuckets = requiredBuckets.filter(name => !bucketNames.includes(name))
    
    if (missingBuckets.length > 0) {
      warnings.push(`Storage bucket(s) not found: ${missingBuckets.join(', ')} - image upload may fail`)
    }
    
    if (bucketNames.length > 0) {
      console.log(`✅ Found ${bucketNames.length} storage bucket(s):`, bucketNames.join(', '))
    }
  } catch (exception) {
    // CRITICAL: Catch-all for unexpected errors - log but NEVER fail startup
    // Storage bucket validation must be non-blocking
    console.log(`ℹ️ Storage bucket validation exception (non-blocking): ${exception instanceof Error ? exception.message : 'Unknown error'}`)
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
    warnings.push('Supabase not configured - authentication will not work')
    return { errors, warnings }
  }
  
  // Check session storage (warn only, don't block)
  if (typeof window !== 'undefined' && !window.localStorage) {
    warnings.push('localStorage not available - session persistence may fail')
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
