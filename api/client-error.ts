/**
 * POST /api/client-error
 * 
 * Receives client-side error reports for monitoring and diagnostics
 * PRODUCTION SAFETY: Never throws, always returns 200 to prevent cascading errors
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ClientErrorPayload {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  type: 'error' | 'unhandledrejection';
  isAuthRelated: boolean;
  path: string;
  buildVersion?: string;
}

// Rate limiting: simple in-memory tracking
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

/**
 * Get client IP address
 */
function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Check rate limit for IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside the window (lazy cleanup)
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check rate limit
    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp)) {
      console.log('[client-error] Rate limit exceeded for IP:', clientIp);
      // Return 200 to prevent client from retrying
      return res.status(200).json({ 
        success: false, 
        message: 'Rate limit exceeded' 
      });
    }

    // Validate payload
    const payload: ClientErrorPayload = req.body;
    
    if (!payload || typeof payload !== 'object') {
      console.error('[client-error] Invalid payload received');
      // Return 200 to prevent client from retrying
      return res.status(200).json({ 
        success: false, 
        message: 'Invalid payload' 
      });
    }

    // Log the error to server logs
    // In production, this would go to monitoring service (Sentry, LogRocket, etc.)
    console.error('[CLIENT ERROR REPORT]', {
      timestamp: payload.timestamp || new Date().toISOString(),
      type: payload.type || 'unknown',
      message: payload.message || 'No message',
      url: payload.url || 'unknown',
      path: payload.path || 'unknown',
      userAgent: payload.userAgent?.substring(0, 100) || 'unknown',
      isAuthRelated: payload.isAuthRelated || false,
      buildVersion: payload.buildVersion || 'unknown',
      clientIp,
      // Include stack trace for debugging (first 500 chars to avoid log spam)
      stack: payload.stack?.substring(0, 500) || 'No stack trace',
    });

    // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
    // Example for Sentry:
    // Sentry.captureException(new Error(payload.message), {
    //   tags: {
    //     type: payload.type,
    //     isAuthRelated: payload.isAuthRelated,
    //   },
    //   extra: {
    //     url: payload.url,
    //     path: payload.path,
    //     userAgent: payload.userAgent,
    //     stack: payload.stack,
    //   },
    // });

    // Always return 200 to prevent client from retrying
    return res.status(200).json({ 
      success: true, 
      message: 'Error reported successfully' 
    });
  } catch (error) {
    // CRITICAL: Never let error reporting endpoint crash
    console.error('[client-error] Error processing client error report:', error);
    
    // Always return 200 to prevent cascading errors
    return res.status(200).json({ 
      success: false, 
      message: 'Error processing report' 
    });
  }
}
