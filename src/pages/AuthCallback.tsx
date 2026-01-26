import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Timeout constants for consistency
const SESSION_WAIT_MS = 1000;
const REDIRECT_DELAY_SHORT_MS = 2000;
const REDIRECT_DELAY_LONG_MS = 3000;

/**
 * Redirect user to appropriate dashboard based on their role
 */
function getRedirectPath(userRole?: string): string {
  if (userRole === 'admin') {
    return '/admin';
  } else if (userRole === 'commercial_advertiser') {
    return '/commercial-dashboard';
  }
  return '/dashboard';
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Auth callback triggered');
        console.log('Current URL:', window.location.href);

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

        console.log('Auth parameters:', { 
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
          
          // Log to console for debugging (could be sent to Sentry in production)
          if (typeof window !== 'undefined' && (window as any).Sentry) {
            (window as any).Sentry.captureMessage('Auth callback error', {
              level: 'error',
              extra: { error, errorDescription, url: window.location.href }
            });
          }
          
          // Redirect to login after delay
          setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
          return;
        }

        // PKCE flow: Exchange code for session
        if (code) {
          console.log('🔑 PKCE flow detected - exchanging code for session');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('❌ Error exchanging code for session:', exchangeError);
            setStatus('error');
            setMessage('Failed to confirm email. Please try again or contact support.');
            
            // Log for debugging
            if (typeof window !== 'undefined' && (window as any).Sentry) {
              (window as any).Sentry.captureException(exchangeError, {
                extra: { code: code.substring(0, 10) + '...', url: window.location.href }
              });
            }
            
            setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
            return;
          }
          
          if (data.session) {
            console.log('✅ Session created via PKCE code exchange');
            console.log('User ID:', data.session.user.id);
            console.log('User Email:', data.session.user.email);
            
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting...');

            // Wait for profile to load, then redirect based on role
            setTimeout(() => {
              const redirectPath = getRedirectPath(profile?.user_role);
              console.log('Redirecting to:', redirectPath);
              navigate(redirectPath);
            }, REDIRECT_DELAY_SHORT_MS);
          } else {
            console.warn('⚠️ No session returned after code exchange');
            setStatus('error');
            setMessage('Could not create session. Please log in.');
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
            setMessage('Failed to confirm email. Please try again.');
            
            if (typeof window !== 'undefined' && (window as any).Sentry) {
              (window as any).Sentry.captureException(sessionError);
            }
            
            setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
            return;
          }

          if (session) {
            console.log('✅ Session created successfully');
            console.log('User ID:', session.user.id);
            console.log('User Email:', session.user.email);
            
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting...');

            // Wait for profile to load, then redirect based on role
            setTimeout(() => {
              const redirectPath = getRedirectPath(profile?.user_role);
              console.log('Redirecting to:', redirectPath);
              navigate(redirectPath);
            }, REDIRECT_DELAY_SHORT_MS);
          } else {
            console.warn('⚠️ No session found after confirmation');
            setStatus('error');
            setMessage('Could not create session. Please log in.');
            setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
          }
        } else if (accessToken && refreshToken) {
          // Direct token-based auth (legacy or alternative flow)
          console.log('✅ Access token found, session should be created automatically');
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          setTimeout(() => {
            const redirectPath = getRedirectPath(profile?.user_role);
            console.log('Redirecting to:', redirectPath);
            navigate(redirectPath);
          }, REDIRECT_DELAY_SHORT_MS);
        } else {
          // No tokens found - might be a direct navigation to this page
          console.log('ℹ️ No auth tokens in URL, redirecting to login');
          setStatus('error');
          setMessage('No authentication data found.');
          setTimeout(() => navigate('/login'), REDIRECT_DELAY_SHORT_MS);
        }
      } catch (err) {
        console.error('❌ Exception in auth callback:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try logging in.');
        
        // Log exception for debugging
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          (window as any).Sentry.captureException(err, {
            extra: { url: window.location.href }
          });
        }
        
        setTimeout(() => navigate('/login'), REDIRECT_DELAY_LONG_MS);
      }
    };

    handleAuthCallback();
  }, [navigate, profile]);

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
              Erreur
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Redirection vers la page de connexion...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
