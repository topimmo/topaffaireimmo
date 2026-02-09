import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isValidUuid } from '@/lib/utils';

// Timeout constants for consistency
const SESSION_WAIT_MS = 1000;
const REDIRECT_DELAY_SHORT_MS = 2000;
const REDIRECT_DELAY_LONG_MS = 3000;

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
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Auth callback triggered');
        console.log('  - Current URL:', window.location.href);
        console.log('  - Online status:', navigator.onLine);
        console.log('  - User agent:', navigator.userAgent);

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
          setStatus('error');
          setMessage(errorDescription || error);
          
          // Redirect to login after delay
          setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
          return;
        }

        // Early network check: If offline and we have a code/token to exchange,
        // show a helpful message instead of attempting the exchange
        if (!navigator.onLine && (code || accessToken)) {
          console.warn('⚠️ User is offline, cannot complete authentication');
          setStatus('error');
          const offlineMsg = isRTL
            ? 'لا يوجد اتصال بالإنترنت. يرجى الاتصال بالإنترنت للمتابعة.'
            : 'Pas de connexion Internet. Veuillez vous connecter pour continuer.';
          setMessage(offlineMsg);
          
          // Redirect to login after delay
          setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
          return;
        }

        // PKCE flow: Exchange code for session
        if (code) {
          console.log('🔑 PKCE flow detected - exchanging code for session via current URL');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
          
          if (exchangeError) {
            console.error('❌ Error exchanging code for session:', exchangeError);
            setStatus('error');
            const failMsg = isRTL
              ? 'فشل في تأكيد البريد الإلكتروني. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.'
              : 'Failed to confirm email. Please try again or contact support.';
            setMessage(failMsg);
            
            setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
            return;
          }
          
          // Debug log: verify session after exchange
          const {
            data: { session: sessionFromCheck },
            error: sessionCheckError
          } = await supabase.auth.getSession();

          let resolvedSession = data.session;

          if (sessionCheckError) {
            console.error('❌ Error fetching session after exchange:', sessionCheckError);

            if (!resolvedSession) {
              setStatus('error');
              const noSessionMsg = isRTL
                ? 'تعذر إنشاء الجلسة. يرجى تسجيل الدخول.'
                : 'Could not create session. Please log in.';
              setMessage(noSessionMsg);
              setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
              return;
            }

            console.log('  - Falling back to session returned from exchange response');
          } else {
            resolvedSession = sessionFromCheck ?? data.session;
          }

          console.log('  - Session after exchange check:', resolvedSession ? 'present' : 'missing');
          
          if (resolvedSession) {
            console.log('✅ Session created via PKCE code exchange');
            console.log('  - User ID:', resolvedSession.user.id);
            console.log('  - User Email:', resolvedSession.user.email);
            
            setStatus('success');
            const successMsg = isRTL
              ? 'تم تأكيد البريد الإلكتروني بنجاح! جاري إعادة التوجيه...'
              : 'Email confirmed successfully! Redirecting...';
            setMessage(successMsg);

            // Get redirect path based on admin status
            const redirectPath = await getRedirectPath(resolvedSession.user.id);
            console.log('  - Redirect destination:', redirectPath);
            
            setTimeout(() => {
              navigate(redirectPath);
            }, REDIRECT_DELAY_SHORT_MS);
          } else {
            console.warn('⚠️ No session returned after code exchange');
            setStatus('error');
            const noSessionMsg = isRTL
              ? 'تعذر إنشاء الجلسة. يرجى تسجيل الدخول.'
              : 'Could not create session. Please log in.';
            setMessage(noSessionMsg);
            setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
          }
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
            setStatus('error');
            const failMsg = isRTL
              ? 'فشل في تأكيد البريد الإلكتروني. يرجى المحاولة مرة أخرى.'
              : 'Failed to confirm email. Please try again.';
            setMessage(failMsg);
            
            setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
            return;
          }

          if (session) {
            console.log('✅ Session created successfully');
            console.log('  - User ID:', session.user.id);
            console.log('  - User Email:', session.user.email);
            
            setStatus('success');
            const successMsg = isRTL
              ? 'تم تأكيد البريد الإلكتروني بنجاح! جاري إعادة التوجيه...'
              : 'Email confirmed successfully! Redirecting...';
            setMessage(successMsg);

            // Get redirect path based on admin status
            const redirectPath = await getRedirectPath(session.user.id);
            console.log('  - Redirect destination:', redirectPath);
            
            setTimeout(() => {
              navigate(redirectPath);
            }, REDIRECT_DELAY_SHORT_MS);
          } else {
            console.warn('⚠️ No session found after confirmation');
            setStatus('error');
            const noSessionMsg = isRTL
              ? 'تعذر إنشاء الجلسة. يرجى تسجيل الدخول.'
              : 'Could not create session. Please log in.';
            setMessage(noSessionMsg);
            setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
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
            setStatus('error');
            const noSessionMsg = isRTL
              ? 'تعذر إنشاء الجلسة. يرجى تسجيل الدخول.'
              : 'Could not create session. Please log in.';
            setMessage(noSessionMsg);
            setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
            return;
          }
          
          setStatus('success');
          const successMsg = isRTL
            ? 'تم التوثيق بنجاح! جاري إعادة التوجيه...'
            : 'Authentication successful! Redirecting...';
          setMessage(successMsg);
          
          console.log('  - User ID:', session.user.id);
          console.log('  - User Email:', session.user.email);
          
          // Get redirect path based on admin status
          const redirectPath = await getRedirectPath(session.user.id);
          console.log('  - Redirect destination:', redirectPath);
          
          setTimeout(() => {
            navigate(redirectPath);
          }, REDIRECT_DELAY_SHORT_MS);
        } else {
          // No tokens found - might be a direct navigation to this page
          console.log('ℹ️ No auth tokens in URL, redirecting to login');
          setStatus('error');
          const noDataMsg = isRTL
            ? 'لم يتم العثور على بيانات المصادقة.'
            : 'No authentication data found.';
          setMessage(noDataMsg);
          setTimeout(() => navigate('/login'), REDIRECT_DELAY_SHORT_MS);
        }
      } catch (err) {
        console.error('❌ Exception in auth callback:', err);
        setStatus('error');
        const errorMsg = isRTL
          ? 'حدث خطأ غير متوقع. يرجى تسجيل الدخول.'
          : 'An unexpected error occurred. Please try logging in.';
        setMessage(errorMsg);
        
        setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
      }
    };

    handleAuthCallback();
  }, [navigate]);

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
