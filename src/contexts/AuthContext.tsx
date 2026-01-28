import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { logger, createCorrelatedLogger } from '@/lib/logger'

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
   * Initialize auth session with retry logic
   */
  const initializeAuth = useCallback(async (retryCount = 0): Promise<void> => {
    const maxRetries = 3;
    const log = createCorrelatedLogger('AuthContext:init');
    
    log.info('Initializing authentication', { retryCount, maxRetries });

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        log.error('Failed to get session', error);
        
        // Retry on network errors
        if (retryCount < maxRetries && isNetworkError(error)) {
          // Exponential backoff with jitter to prevent thundering herd
          const baseDelay = Math.pow(2, retryCount) * 1000;
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          
          log.info(`Retrying in ${Math.round(delay)}ms`, { retryCount });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return initializeAuth(retryCount + 1);
        }
        
        // Give up after max retries
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      log.info('Auth initialized successfully', { 
        hasSession: !!session,
        userId: session?.user?.id 
      });
    } catch (exception) {
      log.error('Exception during auth initialization', exception);
      setSession(null);
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Skip auth initialization if Supabase is not configured
    if (!isSupabaseConfigured) {
      logger.warn('AuthContext', 'Supabase not configured, skipping auth initialization');
      setLoading(false)
      return
    }
    
    // Initialize with retry logic
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('AuthContext', `Auth state changed: ${event}`, { 
        hasSession: !!session,
        userId: session?.user?.id 
      });
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      logger.debug('AuthContext', 'Unsubscribing from auth state changes');
      subscription.unsubscribe();
    }
  }, [initializeAuth])

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
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
