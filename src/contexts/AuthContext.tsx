import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name?: string
  phone?: string
  company_name?: string
  user_role?: 'real_estate_advertiser' | 'commercial_advertiser' | 'admin'
  is_admin?: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    userRole?: string,
    companyName?: string
  ) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) setProfile(data as Profile)
  }

  useEffect(() => {
    // Skip auth initialization if Supabase is not configured
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    userRole?: string,
    companyName?: string
  ): Promise<{ error: AuthError | null }> => {
    if (!isSupabaseConfigured) {
      console.error('❌ Supabase not configured - missing env vars')
      return { error: { message: 'Configuration Supabase manquante. Veuillez vérifier les variables d\'environnement.' } as AuthError }
    }

    console.log('🔐 Starting signup process for:', email)
    console.log('📝 User metadata:', { full_name: fullName, phone, user_role: userRole || 'real_estate_advertiser', company_name: companyName })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          user_role: userRole || 'real_estate_advertiser',
          company_name: companyName || null,
        },
      },
    })

    if (error) {
      console.error('❌ Signup error:', error)
      console.error('Error message:', error.message)
      console.error('Error details:', (error as any).__isAuthError ? 'Auth error' : error)
    } else {
      console.log('✅ Signup successful!')
      console.log('User ID:', data.user?.id)
      console.log('User email:', data.user?.email)
      console.log('Email confirmation required:', data.user?.email_confirmed_at ? 'No' : 'Yes')
      
      // Check if profile was created (after a short delay to allow trigger to complete)
      if (data.user?.id) {
        setTimeout(async () => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (profileError) {
            console.error('❌ Profile fetch error:', profileError)
          } else {
            console.log('✅ Profile created successfully:', profile)
          }
        }, 1000)
      }
    }

    // Profile is automatically created by database trigger (handle_new_user)
    // No need to manually insert/upsert the profile record here

    return { error: error || null }
  }

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    if (!isSupabaseConfigured) {
      console.error('❌ Supabase not configured - missing env vars')
      return { error: { message: 'Configuration Supabase manquante. Veuillez vérifier les variables d\'environnement.' } as AuthError }
    }
    
    console.log('🔐 Attempting sign in for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      console.error('❌ Sign in error:', error)
      console.error('Error message:', error.message)
    } else {
      console.log('✅ Sign in successful!')
      console.log('User ID:', data.user?.id)
      console.log('Session:', data.session ? 'Created' : 'Not created')
    }
    
    return { error: error || null }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
