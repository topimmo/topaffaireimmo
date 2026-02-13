import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isValidUuid } from '@/lib/utils';

// Timeout constants for consistency
const SESSION_WAIT_MS = 500; // Reduced from 1000ms
const REDIRECT_DELAY_SHORT_MS = 1500; // Reduced from 2000ms
const REDIRECT_DELAY_LONG_MS = 2500; // Reduced from 3000ms
const CALLBACK_TIMEOUT_MS = 8000; // Maximum time for entire callback process
const POST_AUTH_REDIRECT_KEY = 'post_auth_redirect';

const peekPostAuthRedirect = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(POST_AUTH_REDIRECT_KEY);
};

function consumePostAuthRedirect(): string | null {
  const path = peekPostAuthRedirect();
  if (path && typeof window !== 'undefined') {
    localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  }
  return path;
}

/**
 * Get redirect path based on user admin status
 * Admin users → /admin
 * Regular users → /
 */
async function getRedirectPath(userId: string): Promise<string> {
  if (!isValidUuid(userId)) {
    console.warn('Invalid user ID provided for redirect check');
    return '/';
  }

  try {
    console.log('🔍 Checking admin status for user:', userId);
    
    // Check if user is an admin by querying the admins table
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // PGRST116 is "not found" error, which is expected for non-admins
      if (error.code === 'PGRST116') {
        console.log('  → User is not admin, redirecting to home');
        return '/';
      } else {
        console.error('  → Error checking admin status:', error);
        // On error, default to home for safety
        return '/';
      }
    }
    
    if (data) {
      console.log('  → User is admin, redirecting to /admin');
      return '/admin';
    }
    
    console.log('  → User is not admin, redirecting to home');
    return '/';
  } catch (err) {
    console.error('  → Exception checking admin status:', err);
    // On exception, default to home for safety
    return '/';
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timeoutIds: NodeJS.Timeout[] = [];
    
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Auth callback triggered');
        console.log('  - Current URL:', window.location.href);
        console.log('  - Online status:', navigator.onLine);
        console.log('  - Stored redirect preference:', peekPostAuthRedirect() || 'none');

        // Set a global timeout for the entire callback process
        const callbackTimeoutId = setTimeout(() => {
          if (cancelled) return;
          console.error('❌ Auth callback timeout - taking too long');
          setStatus('error');
          const timeoutMsg = isRTL
            ? 'انتهت مهلة التأكيد. يرجى المحاولة مرة أخرى.'
            : 'La confirmation a expiré. Veuillez réessayer.';
          setMessage(timeoutMsg);
          const redirectTimeoutId = setTimeout(() => {
            if (!cancelled) navigate('/login');
          }, REDIRECT_DELAY_SHORT_MS);
          timeoutIds.push(redirectTimeoutId);
        }, CALLBACK_TIMEOUT_MS);
        timeoutIds.push(callbackTimeoutId);

        // Check both hash and query params for auth data
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // PKCE flow uses query params with 'code'
        const code = queryParams.get('code');
        
        // Hash-based flow (older or direct token flow)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type') || queryParams.get('type');
        
        // Check for errors in both hash and query
        const error = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

        console.log('  - Auth parameters:', { 
          hasCode: !!code,
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken, 
          type, 
          error, 
          errorDescription 
        });

        // Check for errors in the URL
        if (error) {
          console.error('❌ Auth callback error:', error, errorDescription);
          if (cancelled) return;
          setStatus('error');
          setMessage(errorDescription || error);
          
          // Redirect to login after delay
          const redirectTimeoutId = setTimeout(() => {
            if (!cancelled) navigate('/login');
          }, REDIRECT_DELAY_LONG_MS);
          timeoutIds.push(redirectTimeoutId);
          return;
        }

        // Early network check: If offline and we have a code/token to exchange,
        // show a helpful message instead of attempting the exchange
        if (!navigator.onLine && (code || accessToken)) {
          console.warn('⚠️ User is offline, cannot complete authentication');
          if (cancelled) return;
          setStatus('error');
          const offlineMsg = isRTL
            ? 'لا يوجد اتصال بالإنترنت. يرجى الاتصال بالإنترنت للمتابعة.'
            : 'Pas de connexion Internet. Veuillez vous connecter pour continuer.';
          setMessage(offlineMsg);
          
          // Redirect to login after delay
          const redirectTimeoutId = setTimeout(() => {
            if (!cancelled) navigate('/login');
          }, REDIRECT_DELAY_LONG_MS);
          timeoutIds.push(redirectTimeoutId);
          return;
        }

        // PKCE flow: Exchange code for session
        if (code) {
          console.log('🔑 PKCE flow detected - exchanging code for session');
          
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
          
          if (exchangeError) {
            console.error('❌ Error exchanging code for session:', exchangeError);
            if (!cancelled) navigate('/login?err=oauth', { replace: true });
            return;
          }

          let finalSession = null;
          // Reduced polling - check 5 times with 200ms delay (1 second total)
          for (let attempt = 0; attempt < 5; attempt++) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              finalSession = session;
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          if (!finalSession) {
            console.error('❌ Session not available after exchange');
            if (!cancelled) navigate('/login?err=oauth', { replace: true });
            return;
          }

          if (cancelled) return;
          setStatus('success');
          const successMsg = isRTL
            ? 'تم التوثيق بنجاح! جاري إعادة التوجيه...'
            : 'Authentication successful! Redirecting...';
          setMessage(successMsg);

          const storedRedirect = consumePostAuthRedirect();
          const redirectPath = storedRedirect || '/dashboard';
          
          const redirectTimeoutId = setTimeout(() => {
            if (!cancelled) navigate(redirectPath, { replace: true });
          }, REDIRECT_DELAY_SHORT_MS);
          timeoutIds.push(redirectTimeoutId);
          return;
        }

        // Hash-based flow: Session auto-created by Supabase detectSessionInUrl
        if (type === 'signup' || type === 'recovery' || type === 'invite') {
          console.log(`✅ Email confirmation type: ${type} (hash-based flow)`);
          
          // Wait a moment for Supabase to process the session
          await new Promise(resolve => setTimeout(resolve, SESSION_WAIT_MS));

          // Get the current session to verify it was created
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Error getting session:', sessionError);
            if (cancelled) return;
            setStatus('error');
            const failMsg = isRTL
              ? 'فشل في تأكيد البريد الإلكتروني. يرجى المحاولة مرة أخرى.'
              : 'Failed to confirm email. Please try again.';
            setMessage(failMsg);
            
            const redirectTimeoutId = setTimeout(() => {
              if (!cancelled) navigate('/login');
            }, REDIRECT_DELAY_LONG_MS);
            timeoutIds.push(redirectTimeoutId);
            return;
          }

          if (session) {
            console.log('✅ Session created successfully');
            console.log('  - User ID:', session.user.id);
            console.log('  - User Email:', session.user.email);
            
            if (cancelled) return;
            setStatus('success');
            const successMsg = isRTL
              ? 'تم تأكيد البريد الإلكتروني بنجاح! جاري إعادة التوجيه...'
              : 'Email confirmed successfully! Redirecting...';
            setMessage(successMsg);

            // Get redirect path based on admin status
            const storedRedirect = consumePostAuthRedirect();
            const redirectPath = storedRedirect || (await getRedirectPath(session.user.id));
            console.log('  - Redirect destination:', redirectPath);
            
            const redirectTimeoutId = setTimeout(() => {
              if (!cancelled) navigate(redirectPath);
            }, REDIRECT_DELAY_SHORT_MS);
            timeoutIds.push(redirectTimeoutId);
          } else {
            console.warn('⚠️ No session found after confirmation');
            if (cancelled) return;
            setStatus('error');
            const noSessionMsg = isRTL
              ? 'تعذر إنشاء الجلسة. يرجى تسجيل الدخول.'
              : 'Could not create session. Please log in.';
            setMessage(noSessionMsg);
            const redirectTimeoutId = setTimeout(() => {
              if (!cancelled) navigate('/login');
            }, REDIRECT_DELAY_LONG_MS);
            timeoutIds.push(redirectTimeoutId);
          }
        } else if (accessToken && refreshToken) {
          // Direct token-based auth (legacy or alternative flow)
          console.log('✅ Access token found, session should be created automatically');
          
          // Wait a moment for Supabase to process the session
          await new Promise(resolve => setTimeout(resolve, SESSION_WAIT_MS));

          // Get the current session to get user ID for redirect
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            console.error('❌ Error getting session:', sessionError);
            if (cancelled) return;
            setStatus('error');
            const noSessionMsg = isRTL
              ? 'تعذر إنشاء الجلسة. يرجى تسجيل الدخول.'
              : 'Could not create session. Please log in.';
            setMessage(noSessionMsg);
            const redirectTimeoutId = setTimeout(() => {
              if (!cancelled) navigate('/login');
            }, REDIRECT_DELAY_LONG_MS);
            timeoutIds.push(redirectTimeoutId);
            return;
          }
          
          if (cancelled) return;
          setStatus('success');
          const successMsg = isRTL
            ? 'تم التوثيق بنجاح! جاري إعادة التوجيه...'
            : 'Authentication successful! Redirecting...';
          setMessage(successMsg);
          
          console.log('  - User ID:', session.user.id);
          console.log('  - User Email:', session.user.email);
          
          // Get redirect path based on admin status
          const storedRedirect = consumePostAuthRedirect();
          const redirectPath = storedRedirect || (await getRedirectPath(session.user.id));
          console.log('  - Redirect destination:', redirectPath);
          
          const redirectTimeoutId = setTimeout(() => {
            if (!cancelled) navigate(redirectPath);
          }, REDIRECT_DELAY_SHORT_MS);
          timeoutIds.push(redirectTimeoutId);
        } else {
          // No tokens found - might be a direct navigation to this page
          console.log('ℹ️ No auth tokens in URL, redirecting to login');
          if (cancelled) return;
          setStatus('error');
          const noDataMsg = isRTL
            ? 'لم يتم العثور على بيانات المصادقة.'
            : 'No authentication data found.';
          setMessage(noDataMsg);
          const redirectTimeoutId = setTimeout(() => {
            if (!cancelled) navigate('/login');
          }, REDIRECT_DELAY_SHORT_MS);
          timeoutIds.push(redirectTimeoutId);
        }
      } catch (err) {
        console.error('❌ Exception in auth callback:', err);
        if (cancelled) return;
        setStatus('error');
        const errorMsg = isRTL
          ? 'حدث خطأ غير متوقع. يرجى تسجيل الدخول.'
          : 'An unexpected error occurred. Please try logging in.';
        setMessage(errorMsg);
        
        const redirectTimeoutId = setTimeout(() => {
          if (!cancelled) navigate('/login');
        }, REDIRECT_DELAY_LONG_MS);
        timeoutIds.push(redirectTimeoutId);
      } finally {
        // Cleanup is handled in the useEffect cleanup function
      }
    };

    void handleAuthCallback();
    
    // Cleanup all timeouts on unmount
    return () => {
      cancelled = true;
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [navigate]); // Removed isRTL from dependencies to prevent re-running on language change

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Confirmation en cours...
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant que nous confirmons votre compte
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Succès!
            </h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isRTL ? 'خطأ' : 'Erreur'}
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/login">
                  {isRTL ? 'طلب رابط تأكيد جديد' : 'Demander un nouveau lien de confirmation'}
                </Link>
              </Button>
              <p className="text-sm text-gray-500">
                {isRTL 
                  ? 'أو جاري إعادة التوجيه إلى صفحة تسجيل الدخول...'
                  : 'Ou redirection vers la page de connexion...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
