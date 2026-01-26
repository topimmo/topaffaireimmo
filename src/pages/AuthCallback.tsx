import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

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

        // Get the hash fragment from the URL (Supabase uses hash-based routing for PKCE)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        console.log('Hash parameters:', { 
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
          
          // Redirect to login after 3 seconds
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // For email confirmations, the session is automatically set by Supabase
        // when detectSessionInUrl is enabled
        if (type === 'signup' || type === 'recovery' || type === 'invite') {
          console.log(`✅ Email confirmation type: ${type}`);
          
          // Wait a moment for Supabase to process the session
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Get the current session to verify it was created
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Error getting session:', sessionError);
            setStatus('error');
            setMessage('Failed to confirm email. Please try again.');
            setTimeout(() => navigate('/login'), 3000);
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
              if (profile) {
                console.log('User role:', profile.user_role);
                
                // Redirect based on user role
                if (profile.user_role === 'admin') {
                  navigate('/admin');
                } else if (profile.user_role === 'commercial_advertiser') {
                  navigate('/commercial-dashboard');
                } else {
                  navigate('/dashboard');
                }
              } else {
                // Fallback to dashboard if profile not loaded yet
                console.log('Profile not loaded, redirecting to dashboard');
                navigate('/dashboard');
              }
            }, 2000);
          } else {
            console.warn('⚠️ No session found after confirmation');
            setStatus('error');
            setMessage('Could not create session. Please log in.');
            setTimeout(() => navigate('/login'), 3000);
          }
        } else if (accessToken && refreshToken) {
          // Direct token-based auth (legacy or alternative flow)
          console.log('✅ Access token found, session should be created automatically');
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          setTimeout(() => {
            if (profile) {
              if (profile.user_role === 'admin') {
                navigate('/admin');
              } else if (profile.user_role === 'commercial_advertiser') {
                navigate('/commercial-dashboard');
              } else {
                navigate('/dashboard');
              }
            } else {
              navigate('/dashboard');
            }
          }, 2000);
        } else {
          // No tokens found - might be a direct navigation to this page
          console.log('ℹ️ No auth tokens in URL, redirecting to login');
          setStatus('error');
          setMessage('No authentication data found.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        console.error('❌ Exception in auth callback:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try logging in.');
        setTimeout(() => navigate('/login'), 3000);
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
