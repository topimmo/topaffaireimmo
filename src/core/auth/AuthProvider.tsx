/**
 * Enhanced AuthContext with Clean Architecture
 * Uses profileLoader for single source of truth
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { loadProfile } from '@/core/auth/profileLoader';
import type { EnrichedProfile } from '@/core/permissions/capabilities';

export const AUTH_HYDRATION_TIMEOUT_MS = 4000;

/**
 * Clear only Supabase auth-related keys from storage
 * This prevents stale auth data from causing issues
 */
async function clearAuthStorage(): Promise<void> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    // Clear Supabase auth keys
    const keysToRemove = [
      'topaffaireimmo-auth-token',
      'sb-auth-token', // Legacy key
      'supabase.auth.token', // Another common pattern
    ];
    
    keysToRemove.forEach(key => {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        console.warn(`[AuthContext] Could not remove storage key ${key}:`, err);
      }
    });
    
    console.log('[AuthContext] Auth storage cleared');
  } catch (err) {
    console.warn('[AuthContext] Error clearing auth storage:', err);
  }
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: EnrichedProfile | null;
  loading: boolean;
  profileReady: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<EnrichedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  
  const hasHydratedRef = useRef(false);
  const isInitializingRef = useRef(false);

  const markHydrated = useCallback(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    setLoading(false);
  }, []);

  /**
   * Load user profile using profileLoader
   * This is the single source of truth for profile data
   */
  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileReady(false);
      return;
    }

    console.log('[AuthContext] Loading profile for user:', user.id);
    const result = await loadProfile(user);

    if (result.success && result.profile) {
      console.log('[AuthContext] Profile loaded successfully');
      setProfile(result.profile);
      setProfileReady(true);
    } else {
      console.error('[AuthContext] Profile load failed:', result.error);
      setProfile(null);
      setProfileReady(false);
    }
  }, [user]);

  /**
   * Initialize auth session
   */
  const initializeAuth = useCallback(async (): Promise<void> => {
    console.log('[AuthContext] Initializing authentication');
    
    if (isInitializingRef.current) {
      console.log('[AuthContext] Already initializing, skipping');
      return;
    }
    
    isInitializingRef.current = true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      console.log('[AuthContext] getSession result:', { 
        hasSession: !!session, 
        error: error?.message 
      });

      // Handle refresh token errors gracefully
      if (error) {
        console.error('[AuthContext] Session error:', {
          code: error.code,
          message: error.message,
          path: window.location.pathname
        });
        
        // If it's a refresh token error, clear auth state and treat as logged out
        if (error.message?.includes('refresh') || error.message?.includes('Refresh Token')) {
          console.warn('[AuthContext] Refresh token invalid - clearing auth state');
          await clearAuthStorage();
          await supabase.auth.signOut();
        }
        
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileReady(false);
        markHydrated();
        return;
      }

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        
        // Load profile (will create if missing)
        const profileResult = await loadProfile(session.user);
        
        if (profileResult.success && profileResult.profile) {
          setProfile(profileResult.profile);
          setProfileReady(true);
        } else {
          console.error('[AuthContext] Failed to load profile:', profileResult.error);
          setProfile(null);
          setProfileReady(false);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileReady(false);
      }

      markHydrated();
    } catch (exception) {
      // Don't expose exception details, just log code and message
      if (exception instanceof Error) {
        console.error('[AuthContext] Error details:', {
          message: exception.message,
          path: window.location.pathname
        });
      } else {
        console.error('[AuthContext] Unknown error during initialization:', {
          path: window.location.pathname
        });
      }
      setSession(null);
      setUser(null);
      setProfile(null);
      setProfileReady(false);
      markHydrated();
    } finally {
      isInitializingRef.current = false;
    }
  }, [markHydrated]);

  /**
   * Handle auth state changes
   */
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('[AuthContext] Supabase not configured');
      markHydrated();
      return;
    }

    // Set hydration timeout
    const timeoutId = window.setTimeout(() => {
      if (hasHydratedRef.current) return;
      console.warn('[AuthContext] Hydration timeout, retrying...');
      
      if (!isInitializingRef.current) {
        initializeAuth().catch(err => {
          console.error('[AuthContext] Retry failed:', err);
          markHydrated();
        });
      }
    }, AUTH_HYDRATION_TIMEOUT_MS);

    // Initial auth check
    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event);

        try {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            // Load profile on auth change
            const profileResult = await loadProfile(session.user);
            
            if (profileResult.success && profileResult.profile) {
              setProfile(profileResult.profile);
              setProfileReady(true);
            } else {
              console.error('[AuthContext] Profile load failed in auth change:', profileResult.error);
              setProfile(null);
              setProfileReady(false);
            }
          } else {
            setProfile(null);
            setProfileReady(false);
          }

          markHydrated();
        } catch (error) {
          // Catch any errors in the callback to prevent app crash
          console.error('[AuthContext] Error in auth state change callback:', {
            event,
            error: error instanceof Error ? error.message : 'Unknown error',
            path: window.location.pathname
          });
          
          // If error occurs, treat as logged out to be safe
          setSession(null);
          setUser(null);
          setProfile(null);
          setProfileReady(false);
          markHydrated();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, [initializeAuth, markHydrated]);

  /**
   * Refresh profile when user changes
   */
  useEffect(() => {
    if (user && !profileReady) {
      refreshProfile();
    }
  }, [user, profileReady, refreshProfile]);

  const signUp = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | null }> => {
    console.log('[AuthContext] Signing up user');

    if (!isSupabaseConfigured) {
      return { 
        error: { 
          message: 'Supabase not configured' 
        } as AuthError 
      };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | null }> => {
    console.log('[AuthContext] Signing in user');

    if (!isSupabaseConfigured) {
      return { 
        error: { 
          message: 'Supabase not configured' 
        } as AuthError 
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    console.log('[AuthContext] Signing out');
    
    try {
      await clearAuthStorage();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AuthContext] Error during signOut:', error instanceof Error ? error.message : 'Unknown error');
      // Even if signOut fails, clear local state
      await clearAuthStorage();
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setProfileReady(false);
    }
  };

  const refreshSession = async (): Promise<{ error: AuthError | null }> => {
    console.log('[AuthContext] Refreshing session');

    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[AuthContext] Refresh session error:', {
          code: error.code,
          message: error.message,
          path: window.location.pathname
        });
        
        // If refresh fails, treat as logged out
        if (error.message?.includes('refresh') || error.message?.includes('Refresh Token')) {
          console.warn('[AuthContext] Refresh token invalid - clearing auth state');
          await clearAuthStorage();
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          setProfileReady(false);
        }
        
        return { error };
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        await refreshProfile();
      }

      return { error: null };
    } catch (exception) {
      const errorMessage = exception instanceof Error ? exception.message : 'Unknown error';
      console.error('[AuthContext] Exception during session refresh:', {
        message: errorMessage,
        path: window.location.pathname
      });
      
      // Treat exception as auth failure
      await clearAuthStorage();
      setUser(null);
      setSession(null);
      setProfile(null);
      setProfileReady(false);
      
      return { 
        error: { 
          message: errorMessage,
          name: 'RefreshSessionError',
          status: 0
        } as AuthError 
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileReady,
        signUp,
        signIn,
        signOut,
        refreshSession,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
