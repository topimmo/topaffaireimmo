/**
 * PRODUCTION SAFETY: Environment Variable Utilities
 * 
 * Safe accessors for environment variables that never throw
 * All env access should go through these functions to prevent crashes
 */

/**
 * Safely get an environment variable
 * Never throws - returns undefined if variable is missing or inaccessible
 */
export function getEnv(key: string): string | undefined {
  try {
    const value = import.meta.env?.[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
    return undefined
  } catch (error) {
    console.warn(`[Env] Failed to read environment variable '${key}':`, error instanceof Error ? error.message : 'Unknown error')
    return undefined
  }
}

/**
 * Get an environment variable with a fallback value
 * Never throws - returns fallback if variable is missing
 */
export function getEnvWithFallback(key: string, fallback: string): string {
  return getEnv(key) ?? fallback
}

/**
 * Get a required environment variable
 * Returns the value or undefined if missing, but logs a warning
 */
export function getRequiredEnv(key: string): string | undefined {
  const value = getEnv(key)
  if (!value) {
    console.warn(`[Env] Required environment variable '${key}' is not set`)
  }
  return value
}

/**
 * Check if an environment variable is set
 * Never throws - returns false if check fails
 */
export function hasEnv(key: string): boolean {
  try {
    const value = import.meta.env?.[key]
    return typeof value === 'string' && value.trim() !== ''
  } catch (error) {
    return false
  }
}

/**
 * Get the current environment mode
 * Never throws - returns 'production' as safe fallback
 */
export function getMode(): 'development' | 'production' | 'test' {
  try {
    const mode = import.meta.env?.MODE
    if (mode === 'development' || mode === 'production' || mode === 'test') {
      return mode
    }
    return 'production' // Safe default
  } catch (error) {
    console.warn('[Env] Failed to read MODE:', error instanceof Error ? error.message : 'Unknown error')
    return 'production'
  }
}

/**
 * Check if running in development mode
 * Never throws - returns false as safe default
 */
export function isDev(): boolean {
  try {
    return import.meta.env?.DEV === true
  } catch (error) {
    return false
  }
}

/**
 * Check if running in production mode
 * Never throws - returns true as safe default (fail closed)
 */
export function isProd(): boolean {
  try {
    return import.meta.env?.PROD === true
  } catch (error) {
    return true // Fail to production mode for safety
  }
}

/**
 * Get base URL
 * Never throws - returns '/' as safe fallback
 */
export function getBaseUrl(): string {
  try {
    return import.meta.env?.BASE_URL ?? '/'
  } catch (error) {
    console.warn('[Env] Failed to read BASE_URL:', error instanceof Error ? error.message : 'Unknown error')
    return '/'
  }
}

/**
 * Validate all critical environment variables
 * Returns validation result with errors and warnings
 */
export interface EnvValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Critical variables
  if (!hasEnv('VITE_SUPABASE_URL')) {
    errors.push('VITE_SUPABASE_URL is not set')
  }

  if (!hasEnv('VITE_SUPABASE_ANON_KEY')) {
    errors.push('VITE_SUPABASE_ANON_KEY is not set')
  }

  // Important but not critical
  if (!hasEnv('VITE_PRODUCTION_DOMAIN')) {
    warnings.push('VITE_PRODUCTION_DOMAIN is not set - may affect auth redirects')
  }

  if (!hasEnv('VITE_SITE_URL')) {
    warnings.push('VITE_SITE_URL is not set - using fallback URL')
  }

  // Validate URL format
  const supabaseUrl = getEnv('VITE_SUPABASE_URL')
  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    warnings.push('VITE_SUPABASE_URL should start with http:// or https://')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
