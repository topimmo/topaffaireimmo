/**
 * Build and deployment information
 * Used to verify which version is deployed to production
 */

export const BUILD_INFO = {
  // Vercel provides this during build
  commitSha: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || 
             import.meta.env.VERCEL_GIT_COMMIT_SHA || 
             'local-dev',
  
  // Build timestamp
  buildTime: new Date().toISOString(),
  
  // Environment
  isProduction: import.meta.env.PROD,
  
  // Version (can be updated manually for major releases)
  version: '1.0.0',
} as const;

/**
 * Get a short version of the commit SHA (first 7 chars)
 */
export function getShortCommitSha(): string {
  return BUILD_INFO.commitSha.substring(0, 7);
}

/**
 * Get formatted build info for display
 */
export function getBuildInfoDisplay(): string {
  const shortSha = getShortCommitSha();
  const env = BUILD_INFO.isProduction ? 'production' : 'development';
  return `v${BUILD_INFO.version} (${shortSha}) - ${env}`;
}
