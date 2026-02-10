import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js'
import { logger, createCorrelatedLogger } from '@/lib/logger'
import { getSiteUrl } from '@/lib/utils'

export const AUTH_HYDRATION_TIMEOUT_MS = 4000;

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const lastPathRef = useRef(location.pathname)
  const hasHydratedRef = useRef(false)
  const isInitializingRef = useRef(false)
  const markHydrated = useCallback(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    setLoading(false);
  }, []);

  useEffect(() => {
    lastPathRef.current = location.pathname
  }, [location.pathname])

  /**
   * Check if error is a network error
   */
  const isNetworkError = (error: unknown): boolean => {
    if (!error) return false;
    
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    // Common network error patterns
    const networkErrorPatterns = [
      'failed to fetch',
      'network error',
      'network request failed',
      'timeout',
      'connection refused',
      'connection timeout',
      'networkerror',
      'not connected to internet'
    ];
    
    return networkErrorPatterns.some(pattern => errorMessage.includes(pattern));
  };

  /**
   * Ensure profile exists for authenticated user
   * Creates profile if missing (for Google OAuth or edge cases)
   */
  const ensureProfileExists = async (user: User, log: ReturnType<typeof createCorrelatedLogger>): Promise<void> => {
    try {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        log.error('Error checking profile existence', profileError);
        if (profileError.code === '42501' || profileError.message?.toLowerCase().includes('permission')) {
          setLoading(false);
        }
        return;
      }

      if (!profile) {
        // Profile doesn't exist - create it
        log.warn('Profile missing for authenticated user, creating...', { userId: user.id });

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            user_role: 'real_estate_advertiser', // Default role
            advertiser_type: 'owner', // Default advertiser type
            google_id: user.user_metadata?.google_id || null,
          });

        if (insertError) {
          log.error('Failed to create missing profile', insertError);
          if (insertError.code === '42501' || insertError.message?.toLowerCase().includes('permission')) {
            setLoading(false);
          }
        } else {
          log.info('Successfully created missing profile', { userId: user.id });
        }
      } else {
        log.info('Profile exists for user', { userId: user.id });
      }
    } catch (exception) {
      log.error('Exception during profile check', exception);
    }
  };

  /**
   * Initialize auth session with retry logic
   */
  const initializeAuth = useCallback(async (): Promise<void> => {
    const log = createCorrelatedLogger('AuthContext:init');
    log.info('Initializing authentication');
    if (isInitializingRef.current) {
      log.info('Initialization already in progress - skipping duplicate call');
      return;
    }
    isInitializingRef.current = true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      log.info('getSession() result', { hasSession: !!session, error: error?.message });

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        ensureProfileExists(session.user, log).catch((err) => {
          log.error('ensureProfileExists failed during init', err);
        });
        markHydrated();
      } else {
        setSession(null);
        setUser(null);
        markHydrated();
      }

      if (error && !isNetworkError(error)) {
        log.error('Failed to get session', error);
      }
    } catch (exception) {
      log.error('Exception during auth initialization', exception);
      setSession(null);
      setUser(null);
      markHydrated();
    } finally {
      isInitializingRef.current = false;
    }
  }, [markHydrated]);

  useEffect(() => {
    // Skip auth initialization if Supabase is not configured
    if (!isSupabaseConfigured) {
      logger.warn('AuthContext', 'Supabase not configured, skipping auth initialization');
      hasHydratedRef.current = true;
      setLoading(false)
      return
    }
    
    const timeoutId = window.setTimeout(() => {
      if (hasHydratedRef.current) return;
      logger.warn('AuthContext', 'Hydration timeout hit - retrying session restoration');
      const retryAuth = async () => {
        let succeeded = false;
        try {
          if (!isInitializingRef.current) {
            await initializeAuth();
          }
          succeeded = true;
        } catch (error) {
          logger.error('AuthContext', 'Error during hydration retry', error as Error);
        }
        if (succeeded && !hasHydratedRef.current) {
          markHydrated();
        }
      };
      void retryAuth();
    }, AUTH_HYDRATION_TIMEOUT_MS);

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const log = createCorrelatedLogger('AuthContext:onAuthStateChange');

      log.info(`Auth state changed: ${event}`, { 
        hasSession: !!session,
        userId: session?.user?.id,
        path: lastPathRef.current
      });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        ensureProfileExists(session.user, log).catch((error) => {
          log.error('Exception in ensureProfileExists during auth state change', error);
        });
      }

      markHydrated();
    });

    return () => {
      logger.debug('AuthContext', 'Unsubscribing from auth state changes');
      subscription.unsubscribe();
      window.clearTimeout(timeoutId);
    }
  }, [initializeAuth])

  useEffect(() => {
    const log = createCorrelatedLogger('AuthContext:route');
    log.info('Route change observed', { path: location.pathname, search: location.search });
  }, [location.pathname, location.search]);

  const signUp = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | null }> => {
    const log = createCorrelatedLogger('AuthContext:signUp');
    
    if (!isSupabaseConfigured) {
      const error = { message: 'Configuration Supabase manquante. Veuillez vérifier les variables d\'environnement.' } as AuthError;
      log.error('Supabase not configured', error);
      return { error };
    }

    // Log without email for privacy - use correlation ID for tracking
    log.info('Signing up user');

    try {
      const siteUrl = getSiteUrl();
      const redirectTo = `${siteUrl}/auth/callback`;
      
      log.info('Sign up with redirect', { redirectTo });
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        }
      });
      
      if (error) {
        log.error('Signup failed', error);
      } else {
        log.info('Signup successful');
      }
      
      return { error: error || null };
    } catch (exception) {
      log.error('Signup exception', exception);
      return { error: { message: 'An unexpected error occurred during signup' } as AuthError };
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const log = createCorrelatedLogger('AuthContext:signIn');
    
    if (!isSupabaseConfigured) {
      const error = { message: 'Configuration Supabase manquante. Veuillez vérifier les variables d\'environnement.' } as AuthError;
      log.error('Supabase not configured', error);
      return { error };
    }
    
    // Log without email for privacy - use correlation ID for tracking
    log.info('Signing in user');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        log.error('Sign in failed', error);
      } else {
        log.info('Sign in successful');
      }
      
      return { error: error || null };
    } catch (exception) {
      log.error('Sign in exception', exception);
      return { error: { message: 'An unexpected error occurred during sign in' } as AuthError };
    }
  }

  const signOut = async () => {
    const log = createCorrelatedLogger('AuthContext:signOut');
    
    if (!isSupabaseConfigured) {
      log.warn('Supabase not configured, skipping sign out');
      return;
    }
    
    log.info('Signing out user', { userId: user?.id });

    try {
      await supabase.auth.signOut();
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      
      log.info('Sign out successful');
    } catch (exception) {
      log.error('Sign out exception', exception);
    }
  }

  /**
   * Manually refresh the session
   */
  const refreshSession = async (): Promise<{ error: AuthError | null }> => {
    const log = createCorrelatedLogger('AuthContext:refreshSession');
    
    if (!isSupabaseConfigured) {
      const error = { message: 'Supabase not configured' } as AuthError;
      log.error('Cannot refresh session', error);
      return { error };
    }

    log.info('Refreshing session');

    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        log.error('Session refresh failed', error);
        return { error };
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      log.info('Session refreshed successfully', { userId: session?.user?.id });
      return { error: null };
    } catch (exception) {
      log.error('Session refresh exception', exception);
      return { error: { message: 'An unexpected error occurred during session refresh' } as AuthError };
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
