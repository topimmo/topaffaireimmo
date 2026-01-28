/**
 * Debug Mode Screen
 * Hidden diagnostics panel for troubleshooting auth and session issues
 * Access via: /?debug=true or localStorage.setItem('debug-mode', 'true')
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { X, RefreshCw, Download, Trash2 } from 'lucide-react';

export default function DebugMode() {
  const { user, session, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs());
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Check if debug mode should be visible
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get('debug') === 'true';
    const debugStorage = localStorage.getItem('debug-mode') === 'true';
    
    setIsVisible(debugParam || debugStorage);
    
    if (debugParam && !debugStorage) {
      localStorage.setItem('debug-mode', 'true');
    }
  }, []);

  // Refresh logs every 2 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  // Get session info
  useEffect(() => {
    if (!isVisible) return;
    
    async function fetchSessionInfo() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          setSessionInfo({
            expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
            expiresIn: Math.floor((data.session.expires_at! * 1000 - Date.now()) / 1000),
            accessToken: data.session.access_token.substring(0, 20) + '...',
            refreshToken: data.session.refresh_token.substring(0, 20) + '...',
          });
        }
      } catch (err) {
        console.error('Failed to get session info:', err);
      }
    }
    
    fetchSessionInfo();
    const interval = setInterval(fetchSessionInfo, 5000);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const closeDebugMode = () => {
    localStorage.removeItem('debug-mode');
    setIsVisible(false);
    
    // Remove debug param from URL
    const params = new URLSearchParams(window.location.search);
    params.delete('debug');
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };

  const downloadLogs = () => {
    const logsJson = logger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topaffaireimmo-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={closeDebugMode}
    >
      <div 
        className="bg-background border-2 border-primary rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold">Debug Mode</h2>
          </div>
          <button
            onClick={closeDebugMode}
            className="hover:bg-primary-foreground/20 p-2 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Environment Info */}
          <section className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              🔧 Environment
            </h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Mode:</dt>
              <dd className="font-mono">{import.meta.env.MODE}</dd>
              
              <dt className="text-muted-foreground">Supabase Configured:</dt>
              <dd className="font-mono">{isSupabaseConfigured ? '✅ Yes' : '❌ No'}</dd>
              
              <dt className="text-muted-foreground">Supabase URL:</dt>
              <dd className="font-mono text-xs truncate">
                {import.meta.env.VITE_SUPABASE_URL || '❌ Not set'}
              </dd>
              
              <dt className="text-muted-foreground">Production Domain:</dt>
              <dd className="font-mono text-xs truncate">
                {import.meta.env.VITE_PRODUCTION_DOMAIN || '⚠️ Not set'}
              </dd>
              
              <dt className="text-muted-foreground">Current Origin:</dt>
              <dd className="font-mono text-xs truncate">{window.location.origin}</dd>
            </dl>
          </section>

          {/* Auth State */}
          <section className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              👤 Authentication State
            </h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Auth Loading:</dt>
              <dd className="font-mono">{authLoading ? '⏳ Yes' : '✅ No'}</dd>
              
              <dt className="text-muted-foreground">User ID:</dt>
              <dd className="font-mono text-xs truncate">{user?.id || '❌ Not authenticated'}</dd>
              
              <dt className="text-muted-foreground">Email:</dt>
              <dd className="font-mono text-xs truncate">{user?.email || '❌ Not authenticated'}</dd>
              
              <dt className="text-muted-foreground">Email Confirmed:</dt>
              <dd className="font-mono">{user?.email_confirmed_at ? '✅ Yes' : '⚠️ No'}</dd>
              
              <dt className="text-muted-foreground">Admin Status:</dt>
              <dd className="font-mono">
                {adminLoading ? '⏳ Loading' : isAdmin ? '✅ Admin' : '👤 User'}
              </dd>
              
              <dt className="text-muted-foreground">Session:</dt>
              <dd className="font-mono">{session ? '✅ Active' : '❌ None'}</dd>
            </dl>
          </section>

          {/* Session Info */}
          {sessionInfo && (
            <section className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                🔑 Session Details
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Expires At:</dt>
                <dd className="font-mono text-xs">{sessionInfo.expiresAt}</dd>
                
                <dt className="text-muted-foreground">Expires In:</dt>
                <dd className="font-mono">
                  {sessionInfo.expiresIn > 0 
                    ? `${Math.floor(sessionInfo.expiresIn / 60)}m ${sessionInfo.expiresIn % 60}s` 
                    : '⚠️ Expired'}
                </dd>
                
                <dt className="text-muted-foreground">Access Token:</dt>
                <dd className="font-mono text-xs truncate">{sessionInfo.accessToken}</dd>
                
                <dt className="text-muted-foreground">Refresh Token:</dt>
                <dd className="font-mono text-xs truncate">{sessionInfo.refreshToken}</dd>
              </dl>
            </section>
          )}

          {/* Logs */}
          <section className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                📋 Recent Logs ({logs.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setLogs(logger.getLogs())}
                  className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={downloadLogs}
                  className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={clearLogs}
                  className="flex items-center gap-1 px-3 py-1 bg-destructive text-destructive-foreground rounded-md text-sm hover:bg-destructive/90"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
            
            <div className="max-h-[300px] overflow-auto bg-black/50 rounded p-3 font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <div className="text-muted-foreground text-center py-4">No logs yet</div>
              ) : (
                logs.slice().reverse().map((log, index) => (
                  <div 
                    key={index} 
                    className={`${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                      log.level === 'info' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}
                  >
                    <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    {' '}
                    <span className="text-gray-500">[{log.category}]</span>
                    {log.correlationId && <span className="text-purple-400"> [{log.correlationId}]</span>}
                    {' '}
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
