/**
 * GET /api/health
 * 
 * Simple health check endpoint
 * Returns 200 OK if the API is reachable
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET and HEAD requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return basic health status
    return res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
    });
  } catch (error) {
    // Even if something fails, return 200 to indicate server is reachable
    return res.status(200).json({ 
      status: 'degraded',
      timestamp: new Date().toISOString(),
    });
  }
}
