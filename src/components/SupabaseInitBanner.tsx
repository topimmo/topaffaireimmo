/**
 * Supabase Init Banner
 * 
 * Shows a non-crashing fallback UI when Supabase initialization fails
 * PRODUCTION SAFETY: Always renders, never crashes
 */

import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function SupabaseInitBanner() {
  // Only show banner if supabase failed to initialize
  if (supabase !== null) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Service Configuration Issue
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Some features may be temporarily unavailable. The app is running in limited mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
