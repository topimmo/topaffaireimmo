/**
 * Startup Validation Utility
 * Validates configuration and environment at application startup
 * 
 * PRODUCTION SAFETY: All validations are non-blocking
 * - Never throws errors that would prevent app startup
 * - All async operations have timeouts
 * - Warnings only, no hard failures
 */

import { supabase, isSupabaseConfigured } from './supabase'
import { validateEnvironment, type EnvValidationResult } from './env'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate required environment variables
 * PRODUCTION SAFETY: Uses safe env accessor
 */
function validateEnvironmentVariables(): { errors: string[]; warnings: string[] } {
  try {
    const result = validateEnvironment()
    return {
      errors: result.errors,
      warnings: result.warnings
    }
  } catch (error) {
    console.error('[StartupValidation] Failed to validate environment:', error instanceof Error ? error.message : 'Unknown error')
    return {
      errors: [],
      warnings: ['Failed to validate environment variables']
    }
  }
}

/**
 * Test database connectivity with timeout
 * CRITICAL: This should NEVER block app startup
 * All errors are warnings only
 */
async function testDatabaseConnectivity(): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!isSupabaseConfigured) {
    console.log('ℹ️ Skipping database connectivity test (Supabase not configured)')
    return { errors, warnings }
  }
  
  try {
    // Add timeout to prevent hanging (reduced to 2s for faster startup)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database connectivity test timeout')), 2000)
    })
    
    const testPromise = supabase.from('cities').select('id').limit(1)
    
    const { error } = await Promise.race([testPromise, timeoutPromise])
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for connectivity test
      warnings.push(`Database connectivity issue: ${error.message}`)
      console.warn('⚠️ Database connectivity test failed (non-blocking):', error.message)
    } else {
      console.log('✅ Database connectivity test passed')
    }
  } catch (exception) {
    // CRITICAL: Never let DB connectivity test crash the app
    const message = exception instanceof Error ? exception.message : 'Unknown error'
    warnings.push(`Database connectivity test failed: ${message}`)
    console.warn('⚠️ Database connectivity test exception (non-blocking):', message)
  }
  
  return { errors, warnings }
}

/**
 * Validate storage bucket configuration with timeout
 * CRITICAL: This should NEVER add errors or block startup
 * All failures are warnings only
 */
async function validateStorageBuckets(): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!isSupabaseConfigured) {
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
    // Add timeout to prevent hanging (reduced to 2s for faster startup)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Storage bucket validation timeout')), 2000)
    })
    
    const bucketsPromise = supabase.storage.listBuckets()
    
    const { data: buckets, error } = await Promise.race([bucketsPromise, timeoutPromise])
    
    if (error) {
      // If we can't list buckets, just skip validation silently
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
    const message = exception instanceof Error ? exception.message : 'Unknown error'
    console.warn(`ℹ️ Storage bucket validation exception (non-blocking): ${message}`)
  }
  
  return { errors, warnings }
}

/**
 * Validate authentication configuration
 * PRODUCTION SAFETY: Never throws
 */
function validateAuthConfiguration(): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    if (!isSupabaseConfigured) {
      warnings.push('Supabase not configured - authentication will not work')
      return { errors, warnings }
    }
    
    // Check session storage (warn only, don't block)
    if (typeof window !== 'undefined') {
      try {
        if (!window.localStorage) {
          warnings.push('localStorage not available - session persistence may fail')
        } else {
          // Test if localStorage is actually accessible
          const testKey = '__auth_storage_test__'
          window.localStorage.setItem(testKey, 'test')
          window.localStorage.removeItem(testKey)
        }
      } catch (storageError) {
        warnings.push('localStorage not accessible - session persistence may fail')
      }
    }
  } catch (error) {
    console.warn('[StartupValidation] Auth validation error:', error instanceof Error ? error.message : 'Unknown error')
  }
  
  return { errors, warnings }
}

/**
 * Run all startup validations with timeout
 * PRODUCTION SAFETY: Never blocks app startup, all validations are non-critical
 */
export async function runStartupValidation(): Promise<ValidationResult> {
  try {
    console.log('🔍 Running startup validation...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const allErrors: string[] = []
    const allWarnings: string[] = []
    
    // 1. Validate environment variables (synchronous, fast)
    console.log('1️⃣ Validating environment variables...')
    try {
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
    } catch (error) {
      console.warn('   ⚠️ Environment validation failed (non-blocking)')
    }
    
    // 2. Validate auth configuration (synchronous, fast)
    console.log('2️⃣ Validating authentication configuration...')
    try {
      const authResult = validateAuthConfiguration()
      allErrors.push(...authResult.errors)
      allWarnings.push(...authResult.warnings)
      
      if (authResult.errors.length === 0) {
        console.log('   ✅ Authentication configuration valid')
      } else {
        console.error('   ❌ Authentication configuration errors:', authResult.errors)
      }
    } catch (error) {
      console.warn('   ⚠️ Auth validation failed (non-blocking)')
    }
    
    // 3. Test database connectivity (async, with timeout)
    console.log('3️⃣ Testing database connectivity...')
    try {
      const dbResult = await testDatabaseConnectivity()
      allErrors.push(...dbResult.errors)
      allWarnings.push(...dbResult.warnings)
      
      if (dbResult.errors.length === 0) {
        console.log('   ✅ Database connectivity OK')
      } else {
        console.error('   ❌ Database connectivity errors:', dbResult.errors)
      }
    } catch (error) {
      console.warn('   ⚠️ Database test failed (non-blocking)')
    }
    
    // 4. Validate storage buckets (async, with timeout)
    console.log('4️⃣ Validating storage buckets...')
    try {
      const storageResult = await validateStorageBuckets()
      allErrors.push(...storageResult.errors)
      allWarnings.push(...storageResult.warnings)
      
      if (storageResult.errors.length === 0 && storageResult.warnings.length === 0) {
        console.log('   ✅ Storage buckets configured')
      } else if (storageResult.warnings.length > 0) {
        console.warn('   ⚠️ Storage bucket warnings:', storageResult.warnings)
      }
    } catch (error) {
      console.warn('   ⚠️ Storage validation failed (non-blocking)')
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
  } catch (error) {
    // CRITICAL: If validation itself fails, log but return success
    // The app should still start even if validation crashes
    console.error('[StartupValidation] Validation crashed (non-blocking):', error instanceof Error ? error.message : 'Unknown error')
    return {
      valid: true, // Don't block startup
      errors: [],
      warnings: ['Startup validation crashed but app will continue']
    }
  }
}

/**
 * Run startup validation and show user-friendly error if critical issues found
 * PRODUCTION SAFETY: Never prevents app from starting
 */
export async function validateAndInitialize(): Promise<boolean> {
  try {
    const result = await runStartupValidation()
    
    if (!result.valid) {
      console.error('⛔ Configuration errors detected, but app will continue')
    }
    
    // Always return true - we never block startup
    return true
  } catch (error) {
    console.error('[StartupValidation] validateAndInitialize failed (non-blocking):', error instanceof Error ? error.message : 'Unknown error')
    // Always return true - we never block startup
    return true
  }
}
