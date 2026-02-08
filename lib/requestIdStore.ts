/**
 * In-memory storage for Vonage Verify request IDs with TTL
 * 
 * Maps request IDs to phone numbers with automatic expiration.
 * Used to prevent misuse and link verification requests to phone numbers.
 */

interface RequestIdData {
  phone: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory store
const store = new Map<string, RequestIdData>();

// TTL: 10 minutes (Vonage Verify default expiry is 5 minutes, we add buffer)
const TTL_MS = 10 * 60 * 1000;

/**
 * Store a request ID with associated phone number
 * 
 * @param requestId - Vonage Verify request ID
 * @param phone - Normalized phone number (E.164 format)
 */
export function storeRequestId(requestId: string, phone: string): void {
  const now = Date.now();
  store.set(requestId, {
    phone,
    createdAt: now,
    expiresAt: now + TTL_MS,
  });

  // Cleanup expired entries
  cleanupExpired();
}

/**
 * Get phone number associated with a request ID
 * 
 * @param requestId - Vonage Verify request ID
 * @returns Phone number if found and not expired, null otherwise
 */
export function getPhoneForRequestId(requestId: string): string | null {
  const data = store.get(requestId);
  
  if (!data) {
    return null;
  }

  // Check if expired
  if (Date.now() > data.expiresAt) {
    store.delete(requestId);
    return null;
  }

  return data.phone;
}

/**
 * Delete a request ID from the store
 * 
 * @param requestId - Vonage Verify request ID
 */
export function deleteRequestId(requestId: string): void {
  store.delete(requestId);
}

/**
 * Cleanup expired request IDs
 * Called automatically on store operations
 */
function cleanupExpired(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  // Collect expired keys
  store.forEach((data, requestId) => {
    if (now > data.expiresAt) {
      keysToDelete.push(requestId);
    }
  });
  
  // Delete expired entries
  keysToDelete.forEach(key => store.delete(key));
}

/**
 * Get store statistics (for debugging and monitoring)
 * This function is used for operational monitoring and debugging.
 * It can be exposed via an admin endpoint to check system health.
 */
export function getStoreStats(): {
  totalEntries: number;
  expiredEntries: number;
} {
  const now = Date.now();
  let expiredCount = 0;
  
  store.forEach((data) => {
    if (now > data.expiresAt) {
      expiredCount++;
    }
  });

  return {
    totalEntries: store.size,
    expiredEntries: expiredCount,
  };
}
