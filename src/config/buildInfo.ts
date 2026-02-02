/**
 * Build and deployment information
 * Used to verify which version is deployed to production
 * 
 * Note: buildTime represents when the bundle was created during the build process.
 * It will be the same for all clients since it's captured at module evaluation time
 * during the Vite build. This is intentional and provides a consistent timestamp
 * for the build.
 */

export const BUILD_INFO = {
  // Priority order: Vercel automatic → GitHub Actions → local fallback
  commitSha: import.meta.env.VERCEL_GIT_COMMIT_SHA || 
             import.meta.env.GITHUB_SHA || 
             'local',
  
  // Build timestamp (set when module is evaluated during build)
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
