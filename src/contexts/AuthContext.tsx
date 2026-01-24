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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔐 SIGNUP PROCESS STARTED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Step 1: Verify Supabase is configured
    console.log('Step 1: Checking Supabase configuration...')
    console.log('  - isSupabaseConfigured:', isSupabaseConfigured)
    if (!isSupabaseConfigured) {
      console.error('❌ SIGNUP BLOCKED: Supabase not configured')
      console.error('   Environment variables are missing!')
      return { error: { message: 'Configuration Supabase manquante. Veuillez vérifier les variables d\'environnement.' } as AuthError }
    }
    console.log('  ✅ Supabase is configured')

    // Step 2: Log signup attempt details
    console.log('Step 2: Signup attempt details')
    console.log('  - Email:', email)
    console.log('  - Full Name:', fullName)
    console.log('  - Phone:', phone || '(not provided)')
    console.log('  - User Role:', userRole || 'real_estate_advertiser (default)')
    console.log('  - Company Name:', companyName || '(not provided)')
    console.log('  - Password validation:', password.length >= 6 ? 'OK' : 'Too short')

    // Step 3: Prepare metadata
    const metadata = {
      full_name: fullName,
      phone: phone || null,
      user_role: userRole || 'real_estate_advertiser',
      company_name: companyName || null,
    }
    console.log('Step 3: User metadata prepared:', JSON.stringify(metadata, null, 2))

    // Step 4: Determine email redirect URL
    const emailRedirectTo = typeof window !== 'undefined' && window.location.origin 
      ? `${window.location.origin}/login` 
      : undefined
    if (emailRedirectTo) {
      console.log('Step 4: Email redirect URL:', emailRedirectTo)
    }

    // Step 5: Call Supabase signup
    console.log('Step 5: Calling supabase.auth.signUp()...')
    const signUpStartTime = Date.now()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        ...(emailRedirectTo ? { emailRedirectTo } : {})
      },
    })
    
    const signUpDuration = Date.now() - signUpStartTime
    console.log(`Step 6: Signup API call completed in ${signUpDuration}ms`)

    // Step 7: Handle response
    if (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ SIGNUP FAILED')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Error object:', error)
      console.error('Error message:', error.message)
      console.error('Error status:', (error as any).status)
      console.error('Error name:', error.name)
      console.error('Full error:', JSON.stringify(error, null, 2))
      return { error: error || null }
    }

    // Success logging
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ SIGNUP API CALL SUCCESSFUL')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Response data:', {
      user_id: data.user?.id,
      user_email: data.user?.email,
      email_confirmed_at: data.user?.email_confirmed_at,
      created_at: data.user?.created_at,
      session: data.session ? 'Session created' : 'No session (email confirmation required)',
    })
    
    if (data.user) {
      console.log('✅ User created in Supabase Auth')
      console.log('   - User ID:', data.user.id)
      console.log('   - Email:', data.user.email)
      console.log('   - Email confirmed:', data.user.email_confirmed_at ? 'Yes ✓' : 'No (confirmation email sent)')
      console.log('   - Created at:', data.user.created_at)
      console.log('   - User metadata:', data.user.user_metadata)
    } else {
      console.warn('⚠️ No user object in response (may indicate duplicate email)')
    }

    if (data.session) {
      console.log('✅ Session created immediately (email confirmation disabled)')
    } else {
      console.log('ℹ️ No session yet - email confirmation required')
      console.log('   User should check their email for confirmation link')
    }

    console.log('ℹ️ Profile creation:')
    console.log('   - Profile will be created automatically by database trigger (handle_new_user)')
    console.log('   - Trigger fires on auth.users INSERT')
    console.log('   - Check Supabase Dashboard → Database → profiles table to verify')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Profile is automatically created by database trigger (handle_new_user)
    // No need to manually insert/upsert the profile record here

    return { error: error || null }
  }

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔐 SIGNIN PROCESS STARTED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (!isSupabaseConfigured) {
      console.error('❌ SIGNIN BLOCKED: Supabase not configured')
      return { error: { message: 'Configuration Supabase manquante. Veuillez vérifier les variables d\'environnement.' } as AuthError }
    }
    
    console.log('Attempting sign in for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ SIGNIN FAILED')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Error message:', error.message)
      console.error('Error status:', (error as any).status)
      console.error('Full error:', JSON.stringify(error, null, 2))
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ SIGNIN SUCCESSFUL')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('User ID:', data.user?.id)
      console.log('Session created:', data.session ? 'Yes ✓' : 'No')
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
