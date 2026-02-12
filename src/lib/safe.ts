/**
 * PRODUCTION SAFETY: Global Error Handler
 * 
 * This module wraps the entire application in a try-catch to ensure
 * that no module initialization error can crash the app before React even starts.
 * 
 * This is the last line of defense against production crashes.
 */

/**
 * Safe function wrapper
 * Wraps any function to catch and log errors without throwing
 */
export function safeWrap<T extends (...args: any[]) => any>(
  fn: T,
  context: string
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // If result is a promise, catch promise rejections
      if (result && typeof result.then === 'function') {
        return result.catch((error: Error) => {
          console.error(`[SafeWrap] Promise rejection in ${context}:`, error.message);
          return null;
        });
      }
      
      return result;
    } catch (error) {
      console.error(`[SafeWrap] Error in ${context}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }) as T;
}

/**
 * Safe async function wrapper
 * Wraps async functions to always resolve (never reject)
 */
export function safeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string,
  fallbackValue: any = null
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`[SafeAsync] Error in ${context}:`, error instanceof Error ? error.message : 'Unknown error');
      return fallbackValue;
    }
  }) as T;
}

/**
 * Safe localStorage accessor
 * Never throws, returns null if localStorage is unavailable
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (error) {
      console.warn(`[SafeLocalStorage] Failed to get item '${key}':`, error instanceof Error ? error.message : 'Unknown error');
    }
    return null;
  },

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.warn(`[SafeLocalStorage] Failed to set item '${key}':`, error instanceof Error ? error.message : 'Unknown error');
    }
    return false;
  },

  removeItem(key: string): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.warn(`[SafeLocalStorage] Failed to remove item '${key}':`, error instanceof Error ? error.message : 'Unknown error');
    }
    return false;
  },

  clear(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        return true;
      }
    } catch (error) {
      console.warn(`[SafeLocalStorage] Failed to clear:`, error instanceof Error ? error.message : 'Unknown error');
    }
    return false;
  }
};

/**
 * Safe sessionStorage accessor
 * Never throws, returns null if sessionStorage is unavailable
 */
export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch (error) {
      console.warn(`[SafeSessionStorage] Failed to get item '${key}':`, error instanceof Error ? error.message : 'Unknown error');
    }
    return null;
  },

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.warn(`[SafeSessionStorage] Failed to set item '${key}':`, error instanceof Error ? error.message : 'Unknown error');
    }
    return false;
  },

  removeItem(key: string): boolean {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.warn(`[SafeSessionStorage] Failed to remove item '${key}':`, error instanceof Error ? error.message : 'Unknown error');
    }
    return false;
  },

  clear(): boolean {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
        return true;
      }
    } catch (error) {
      console.warn(`[SafeSessionStorage] Failed to clear:`, error instanceof Error ? error.message : 'Unknown error');
    }
    return false;
  }
};

/**
 * Safe JSON parse
 * Never throws, returns fallback value on error
 */
export function safeJsonParse<T = any>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn('[SafeJsonParse] Failed to parse JSON:', error instanceof Error ? error.message : 'Unknown error');
    return fallback;
  }
}

/**
 * Safe JSON stringify
 * Never throws, returns fallback string on error
 */
export function safeJsonStringify(value: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('[SafeJsonStringify] Failed to stringify:', error instanceof Error ? error.message : 'Unknown error');
    return fallback;
  }
}

/**
 * Safe fetch wrapper
 * Never throws, always returns a response (even if it's an error response)
 */
export async function safeFetch(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data: any; error: string | null; status: number }> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status
      };
    }
    
    const data = await response.json();
    return {
      ok: true,
      data,
      error: null,
      status: response.status
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SafeFetch] Fetch failed:', message);
    return {
      ok: false,
      data: null,
      error: message,
      status: 0
    };
  }
}
