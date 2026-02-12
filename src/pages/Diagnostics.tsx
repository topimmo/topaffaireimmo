/**
 * Diagnostics Page (DEV only)
 * 
 * Shows system status and diagnostics for debugging
 * PRODUCTION SAFETY: Only accessible in development mode
 */

import { useEffect, useState } from 'react';
import { runBootHealthCheck, type HealthCheckResult } from '@/lib/bootHealthCheck';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isDev } from '@/lib/env';

interface DiagnosticsData {
  storage: {
    available: boolean;
    accessible: boolean;
    error?: string;
  };
  navigatorLocks: {
    available: boolean;
    disabled: boolean;
  };
  supabase: {
    configured: boolean;
    url?: string;
  };
  healthCheck?: HealthCheckResult;
  environment: {
    mode: string;
    isDev: boolean;
  };
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDiagnostics() {
      try {
        // Check storage availability
        let storageAvailable = false;
        let storageAccessible = false;
        let storageError: string | undefined;

        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            storageAvailable = true;
            const testKey = '__diagnostics_test__';
            window.localStorage.setItem(testKey, 'test');
            window.localStorage.removeItem(testKey);
            storageAccessible = true;
          }
        } catch (error) {
          storageError = error instanceof Error ? error.message : 'Unknown error';
        }

        // Check navigator.locks
        const navigatorLocksAvailable = typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks !== undefined;
        const navigatorLocksDisabled = typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks === undefined;

        // Check Supabase configuration
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

        // Run health check
        const healthCheck = await runBootHealthCheck();

        setDiagnostics({
          storage: {
            available: storageAvailable,
            accessible: storageAccessible,
            error: storageError,
          },
          navigatorLocks: {
            available: navigatorLocksAvailable,
            disabled: navigatorLocksDisabled,
          },
          supabase: {
            configured: isSupabaseConfigured,
            url: supabaseUrl?.substring(0, 50),
          },
          healthCheck,
          environment: {
            mode: import.meta.env.MODE,
            isDev: isDev(),
          },
        });
      } catch (error) {
        console.error('[Diagnostics] Error running diagnostics:', error);
      } finally {
        setLoading(false);
      }
    }

    runDiagnostics();
  }, []);

  // Only show in development
  if (!isDev()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6">
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            This page is only accessible in development mode.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !diagnostics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">System Diagnostics</h1>
          <p className="text-sm text-muted-foreground">
            Development mode only • Last updated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Environment */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Mode:</span>
              <span className="font-mono">{diagnostics.environment.mode}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Is Development:</span>
              <span className={diagnostics.environment.isDev ? 'text-green-600' : 'text-red-600'}>
                {diagnostics.environment.isDev ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Storage</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Available:</span>
              <span className={diagnostics.storage.available ? 'text-green-600' : 'text-red-600'}>
                {diagnostics.storage.available ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Accessible:</span>
              <span className={diagnostics.storage.accessible ? 'text-green-600' : 'text-red-600'}>
                {diagnostics.storage.accessible ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            {diagnostics.storage.error && (
              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                <span className="font-medium">Error: </span>
                <span className="font-mono text-xs">{diagnostics.storage.error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigator Locks */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Navigator Locks</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Available in Browser:</span>
              <span className={diagnostics.navigatorLocks.available ? 'text-green-600' : 'text-yellow-600'}>
                {diagnostics.navigatorLocks.available ? '✅ Yes' : '⚠️ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Disabled by App:</span>
              <span className={diagnostics.navigatorLocks.disabled ? 'text-green-600' : 'text-yellow-600'}>
                {diagnostics.navigatorLocks.disabled ? '✅ Yes (Safe)' : '⚠️ No'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Navigator Locks is disabled to prevent Supabase gotrue-js crashes
            </p>
          </div>
        </div>

        {/* Supabase */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Supabase</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Configured:</span>
              <span className={diagnostics.supabase.configured ? 'text-green-600' : 'text-red-600'}>
                {diagnostics.supabase.configured ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            {diagnostics.supabase.url && (
              <div className="mt-2">
                <span className="font-medium">URL: </span>
                <span className="font-mono text-xs">{diagnostics.supabase.url}...</span>
              </div>
            )}
          </div>
        </div>

        {/* Health Check */}
        {diagnostics.healthCheck && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Health Check</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Overall Status:</span>
                <span className={diagnostics.healthCheck.healthy ? 'text-green-600' : 'text-red-600'}>
                  {diagnostics.healthCheck.healthy ? '✅ Healthy' : '❌ Unhealthy'}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">API Check:</h3>
                <div className="pl-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className={diagnostics.healthCheck.checks.api.status === 'ok' ? 'text-green-600' : 'text-red-600'}>
                      {diagnostics.healthCheck.checks.api.status}
                    </span>
                  </div>
                  {diagnostics.healthCheck.checks.api.responseTime && (
                    <div className="flex justify-between text-sm">
                      <span>Response Time:</span>
                      <span>{diagnostics.healthCheck.checks.api.responseTime}ms</span>
                    </div>
                  )}
                  {diagnostics.healthCheck.checks.api.error && (
                    <div className="text-sm text-red-600">
                      Error: {diagnostics.healthCheck.checks.api.error}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Supabase Check:</h3>
                <div className="pl-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className={diagnostics.healthCheck.checks.supabase.status === 'ok' ? 'text-green-600' : 
                                     diagnostics.healthCheck.checks.supabase.status === 'skipped' ? 'text-yellow-600' : 'text-red-600'}>
                      {diagnostics.healthCheck.checks.supabase.status}
                    </span>
                  </div>
                  {diagnostics.healthCheck.checks.supabase.responseTime && (
                    <div className="flex justify-between text-sm">
                      <span>Response Time:</span>
                      <span>{diagnostics.healthCheck.checks.supabase.responseTime}ms</span>
                    </div>
                  )}
                  {diagnostics.healthCheck.checks.supabase.error && (
                    <div className="text-sm text-red-600">
                      Error: {diagnostics.healthCheck.checks.supabase.error}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Timestamp: {diagnostics.healthCheck.timestamp}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
