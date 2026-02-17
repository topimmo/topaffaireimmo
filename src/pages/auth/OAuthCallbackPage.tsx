import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * OAuth Callback Handler
 * 
 * This page handles the redirect after OAuth authentication (Google, Facebook, etc.)
 * 
 * Flow:
 * 1. User clicks "Sign in with Google" on LoginPage
 * 2. User is redirected to Google for authentication
 * 3. Google redirects back to this page with auth code in URL
 * 4. Supabase automatically exchanges the code for a session
 * 5. We verify the session and redirect to dashboard/home
 */
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        if (!supabase) {
          console.error('[OAuth Callback] Supabase not configured');
          setError('Configuration error. Please contact support.');
          setIsProcessing(false);
          return;
        }

        // CRITICAL: Get session from URL hash/query params
        // Supabase automatically handles the OAuth code exchange
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[OAuth Callback] Session error:', sessionError.message);
          setError('Authentication failed. Please try again.');
          setIsProcessing(false);
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        if (!session) {
          console.warn('[OAuth Callback] No session found after OAuth callback');
          setError('No session found. Redirecting to login...');
          setIsProcessing(false);
          
          // Redirect to login immediately
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }

        // SUCCESS: Session established
        console.log('[OAuth Callback] ✅ Session established:', {
          userId: session.user.id,
          email: session.user.email,
          provider: session.user.app_metadata.provider
        });

        // Wait for profile to be created/loaded
        // Instead of hardcoded timeout, wait for actual profile data
        let profileLoaded = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!profileLoaded && attempts < maxAttempts) {
          attempts++;
          
          // Check if profile exists in database
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            profileLoaded = true;
            console.log('[OAuth Callback] ✅ Profile loaded after', attempts, 'attempts');
          } else {
            // Profile not ready yet, wait and retry
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        if (!profileLoaded) {
          console.warn('[OAuth Callback] ⚠️  Profile not found after max attempts');
          // Continue anyway - the AuthContext will handle profile creation
        }

        // Redirect to home page (or dashboard based on role)
        // The AuthContext will handle profile loading
        navigate('/');
        
      } catch (error) {
        console.error('[OAuth Callback] Unexpected error:', error);
        setError('An unexpected error occurred. Please try again.');
        setIsProcessing(false);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0A1F2E] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        {isProcessing ? (
          <>
            <Loader2 className="h-16 w-16 text-[#0FC2C0] animate-spin mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Completing sign in...</h1>
              <p className="text-gray-400">Please wait while we set up your account.</p>
            </div>
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Authentication Error</h1>
              <p className="text-gray-400">{error}</p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
