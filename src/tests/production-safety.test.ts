/**
 * Production Safety Tests
 * 
 * These tests verify that the application handles all failure scenarios gracefully
 * and never crashes during initialization, even with missing/invalid configuration.
 * 
 * Test scenarios:
 * 1. Missing VITE_SUPABASE_URL
 * 2. Missing VITE_SUPABASE_ANON_KEY
 * 3. Invalid Supabase credentials
 * 4. localStorage unavailable (private browsing mode)
 * 5. Network failures during startup validation
 * 6. Database connection failures
 * 7. Storage bucket access failures
 * 8. Auth initialization failures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock import.meta.env for testing
const originalEnv = { ...import.meta.env };

describe('Production Safety - Environment Variable Handling', () => {
  afterEach(() => {
    // Restore original env
    Object.assign(import.meta.env, originalEnv);
  });

  it('should handle missing VITE_SUPABASE_URL gracefully', async () => {
    // Simulate missing env var
    delete import.meta.env.VITE_SUPABASE_URL;
    
    const { getEnv, hasEnv, validateEnvironment } = await import('@/lib/env');
    
    // getEnv should return undefined
    expect(getEnv('VITE_SUPABASE_URL')).toBeUndefined();
    
    // hasEnv should return false
    expect(hasEnv('VITE_SUPABASE_URL')).toBe(false);
    
    // Validation should report error
    const validation = validateEnvironment();
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('VITE_SUPABASE_URL is not set');
  });

  it('should handle missing VITE_SUPABASE_ANON_KEY gracefully', async () => {
    delete import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const { validateEnvironment } = await import('@/lib/env');
    
    const validation = validateEnvironment();
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('VITE_SUPABASE_ANON_KEY is not set');
  });

  it('should provide safe defaults for MODE', async () => {
    delete import.meta.env.MODE;
    
    const { getMode } = await import('@/lib/env');
    
    // Should default to 'production' for safety
    expect(getMode()).toBe('production');
  });

  it('should handle isDev/isProd safely', async () => {
    const { isDev, isProd } = await import('@/lib/env');
    
    // Should never throw
    expect(() => isDev()).not.toThrow();
    expect(() => isProd()).not.toThrow();
    
    // At least one should be true
    expect(isDev() || isProd()).toBe(true);
  });
});

describe('Production Safety - Supabase Initialization', () => {
  it('should create Supabase client even with missing credentials', async () => {
    delete import.meta.env.VITE_SUPABASE_URL;
    delete import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const module = await import('@/lib/supabase');
    const { supabase, isSupabaseConfigured } = module;
    
    // Should indicate not configured
    expect(isSupabaseConfigured).toBe(false);
    
    // Client should still exist (fallback)
    expect(supabase).toBeDefined();
    expect(supabase).not.toBeNull();
  });

  it('should never throw during client creation', async () => {
    // Even with completely invalid config
    import.meta.env.VITE_SUPABASE_URL = 'not-a-valid-url';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'invalid-key';
    
    // Should successfully import without throwing
    await expect(import('@/lib/supabase')).resolves.toBeDefined();
  });
});

describe('Production Safety - localStorage Handling', () => {
  let localStorageGetItem: any;
  let localStorageSetItem: any;
  
  beforeEach(() => {
    localStorageGetItem = window.localStorage.getItem;
    localStorageSetItem = window.localStorage.setItem;
  });
  
  afterEach(() => {
    window.localStorage.getItem = localStorageGetItem;
    window.localStorage.setItem = localStorageSetItem;
  });

  it('should handle localStorage.getItem throwing', async () => {
    // Simulate private browsing mode where localStorage throws
    window.localStorage.getItem = () => {
      throw new Error('localStorage is disabled');
    };
    
    const { safeLocalStorage } = await import('@/lib/safe');
    
    // Should not throw
    expect(() => safeLocalStorage.getItem('test-key')).not.toThrow();
    
    // Should return null
    expect(safeLocalStorage.getItem('test-key')).toBeNull();
  });

  it('should handle localStorage.setItem throwing', async () => {
    window.localStorage.setItem = () => {
      throw new Error('localStorage is disabled');
    };
    
    const { safeLocalStorage } = await import('@/lib/safe');
    
    // Should not throw
    expect(() => safeLocalStorage.setItem('test-key', 'test-value')).not.toThrow();
    
    // Should return false to indicate failure
    expect(safeLocalStorage.setItem('test-key', 'test-value')).toBe(false);
  });
});

describe('Production Safety - JSON Handling', () => {
  it('should handle invalid JSON gracefully', async () => {
    const { safeJsonParse } = await import('@/lib/safe');
    
    const invalidJson = '{invalid json}';
    const fallback = { error: true };
    
    // Should not throw
    expect(() => safeJsonParse(invalidJson, fallback)).not.toThrow();
    
    // Should return fallback
    expect(safeJsonParse(invalidJson, fallback)).toEqual(fallback);
  });

  it('should handle circular references in JSON.stringify', async () => {
    const { safeJsonStringify } = await import('@/lib/safe');
    
    // Create circular reference
    const obj: any = { a: 1 };
    obj.self = obj;
    
    // Should not throw
    expect(() => safeJsonStringify(obj)).not.toThrow();
    
    // Should return fallback
    expect(safeJsonStringify(obj, '{}')).toBe('{}');
  });
});

describe('Production Safety - Startup Validation', () => {
  it('should complete validation even if database is unreachable', async () => {
    const { runStartupValidation } = await import('@/lib/startup-validation');
    
    // Should complete without throwing
    const result = await runStartupValidation();
    
    // Should return a result (even if with warnings)
    expect(result).toBeDefined();
    expect(result.valid).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.warnings).toBeDefined();
  });

  it('should have timeout on database connectivity test', async () => {
    const { runStartupValidation } = await import('@/lib/startup-validation');
    
    const startTime = Date.now();
    await runStartupValidation();
    const endTime = Date.now();
    
    // Should complete within reasonable time (not hang indefinitely)
    // Maximum 30 seconds for all validations
    expect(endTime - startTime).toBeLessThan(30000);
  });

  it('should never block app startup', async () => {
    const { validateAndInitialize } = await import('@/lib/startup-validation');
    
    // Should always return true (never block)
    const canStart = await validateAndInitialize();
    expect(canStart).toBe(true);
  });
});

describe('Production Safety - Module Initialization', () => {
  it('should not throw during config/site.ts initialization', async () => {
    await expect(import('@/config/site')).resolves.toBeDefined();
  });

  it('should export valid SITE_URL even with missing env', async () => {
    delete import.meta.env.VITE_PRODUCTION_DOMAIN;
    delete import.meta.env.VITE_SITE_URL;
    
    const { SITE_URL } = await import('@/config/site');
    
    // Should have a fallback value
    expect(SITE_URL).toBeDefined();
    expect(typeof SITE_URL).toBe('string');
    expect(SITE_URL.length).toBeGreaterThan(0);
  });
});

describe('Production Safety - Error Boundaries', () => {
  it('should import ErrorBoundary without crashing', async () => {
    await expect(import('@/components/ErrorBoundary')).resolves.toBeDefined();
  });
});

describe('Production Safety - Global Error Handlers', () => {
  it('should setup global error handlers without throwing', async () => {
    const { setupGlobalErrorHandlers } = await import('@/lib/globalErrorHandlers');
    
    // Should not throw
    expect(() => setupGlobalErrorHandlers()).not.toThrow();
  });

  it('should handle auth token check without throwing', async () => {
    const { checkForStaleAuthToken } = await import('@/lib/globalErrorHandlers');
    
    // Should not throw
    expect(() => checkForStaleAuthToken()).not.toThrow();
  });
});

describe('Production Safety - Safe Utility Functions', () => {
  it('should wrap functions safely', async () => {
    const { safeWrap } = await import('@/lib/safe');
    
    const throwingFunction = () => {
      throw new Error('This function throws');
    };
    
    const wrappedFunction = safeWrap(throwingFunction, 'test');
    
    // Should not throw
    expect(() => wrappedFunction()).not.toThrow();
    
    // Should return null on error
    expect(wrappedFunction()).toBeNull();
  });

  it('should wrap async functions safely', async () => {
    const { safeAsync } = await import('@/lib/safe');
    
    const throwingAsyncFunction = async () => {
      throw new Error('This async function throws');
    };
    
    const wrappedFunction = safeAsync(throwingAsyncFunction, 'test', 'fallback');
    
    // Should not throw
    const result = await wrappedFunction();
    
    // Should return fallback value
    expect(result).toBe('fallback');
  });

  it('should handle fetch failures gracefully', async () => {
    const { safeFetch } = await import('@/lib/safe');
    
    // Fetch to invalid URL
    const result = await safeFetch('http://invalid-url-that-does-not-exist.local');
    
    // Should not throw, should return error response
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.data).toBeNull();
  });
});
