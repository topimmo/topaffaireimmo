import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export type UserRole = 'user' | 'artisan' | 'advertiser' | 'admin';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile from database
  const loadProfile = async (userId: string) => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Auth] Error loading profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Auth] Exception loading profile:', error);
      return null;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (!user) return;
    const profileData = await loadProfile(user.id);
    if (profileData) {
      setProfile(profileData);
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id).then(setProfile);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') as AuthError };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        const profileData = await loadProfile(data.user.id);
        setProfile(profileData);
      }

      return { error: null };
    } catch (error) {
      console.error('[Auth] Sign in error:', error);
      return { error: error as AuthError };
    }
  };

  // Sign in with OAuth (Google/Facebook)
  const signInWithOAuth = async (provider: 'google' | 'facebook') => {
    if (!supabase) {
      console.error('[Auth] OAuth Error: Supabase not configured');
      return { error: new Error('Supabase not configured') as AuthError };
    }

    try {
      // CRITICAL: Use redirect mode (NOT popup) for better mobile/desktop compatibility
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // Dynamic redirect based on current origin (not hardcoded)
          redirectTo: `${window.location.origin}/auth/callback`,
          // Force account selection for better UX
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        console.error(`[Auth] ${provider} OAuth Error:`, error.message);
        return { error };
      }

      // Note: User will be redirected to OAuth provider, then back to /auth/callback
      // The actual session will be established in the callback handler
      return { error: null };
    } catch (error) {
      console.error(`[Auth] ${provider} OAuth Exception:`, error);
      return { error: error as AuthError };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') as AuthError };
    }

    try {
      // First, create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_role: role,
          },
        },
      });

      if (error) return { error };

      // The profile should be created by the database trigger
      // But we'll verify and create if needed
      if (data.user) {
        // Wait a bit for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile exists, if not create it
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          // Create profile manually if trigger didn't work
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            user_role: role,
          });
        }

        const profileData = await loadProfile(data.user.id);
        setProfile(profileData);
      }

      return { error: null };
    } catch (error) {
      console.error('[Auth] Sign up error:', error);
      return { error: error as AuthError };
    }
  };

  // Sign out
  const signOut = async () => {
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') as AuthError };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error };
    } catch (error) {
      console.error('[Auth] Reset password error:', error);
      return { error: error as AuthError };
    }
  };

  // Update password
  const updatePassword = async (newPassword: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') as AuthError };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error };
    } catch (error) {
      console.error('[Auth] Update password error:', error);
      return { error: error as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    role: (profile?.user_role as UserRole) || null,
    isAdmin: profile?.is_admin === true || profile?.user_role === 'admin',
    signIn,
    signInWithOAuth,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
