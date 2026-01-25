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
  is_active?: boolean
  is_verified?: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  profileLoading: boolean
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
  const [profileLoading, setProfileLoading] = useState(false)

  const fetchProfile = async (userId: string, retryCount = 0) => {
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setProfile(data as Profile)
        console.log('✅ Profile loaded successfully:', data.email)
      } else if (error) {
        console.error('❌ Error fetching profile:', error)
        
        // PGRST116 = "not found" error - profile doesn't exist
        if (error.code === 'PGRST116' && retryCount === 0) {
          console.warn('⚠️ Profile not found for authenticated user. Attempting to create fallback profile...')
          
          // Try to create a fallback profile
          const createdProfile = await createFallbackProfile(userId)
          if (createdProfile) {
            setProfile(createdProfile)
            console.log('✅ Fallback profile created successfully')
          } else {
            // If creation fails, retry fetching once more (in case trigger is delayed)
            console.log('⏳ Retrying profile fetch after delay...')
            setTimeout(() => fetchProfile(userId, retryCount + 1), 2000)
          }
        } else {
          setProfile(null)
        }
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const createFallbackProfile = async (userId: string): Promise<Profile | null> => {
    try {
      // Get user data from auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('Cannot create fallback profile: user not found')
        return null
      }

      console.log('Creating fallback profile for user:', user.email)
      console.log('User metadata:', user.user_metadata)

      // Insert profile with metadata from auth user
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || null,
          user_role: user.user_metadata?.user_role || 'real_estate_advertiser',
          company_name: user.user_metadata?.company_name || null,
          is_active: true,
          is_verified: !!user.email_confirmed_at,
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create fallback profile:', error)
        return null
      }

      console.log('✅ Fallback profile created:', data)
      return data as Profile
    } catch (err) {
      console.error('Exception creating fallback profile:', err)
      return null
    }
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
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setProfileLoading(false)
      }
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
    <AuthContext.Provider value={{ user, profile, session, loading, profileLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
