/**
 * OTP Login Example Page
 * 
 * Demonstrates how to integrate the OTPLogin component into your application.
 * This is a reference implementation showing the complete authentication flow.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OTPLogin } from '../auth/OTPLogin';

/**
 * Example login page using OTP authentication
 */
export function OTPLoginExample() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<{
    token: string | null;
    phone: string | null;
  }>({
    token: null,
    phone: null,
  });

  const handleSuccess = (token: string, phone: string) => {
    console.log('✅ OTP Login successful!', { phone });
    
    // Store authentication state
    setAuthState({ token, phone });
    
    // Store in localStorage for persistence
    localStorage.setItem('otp_auth_token', token);
    localStorage.setItem('otp_auth_phone', phone);
    
    // Optional: Send analytics event
    // trackEvent('otp_login_success', { phone });
    
    // Redirect to dashboard or home page
    navigate('/dashboard');
  };

  const handleError = (error: string) => {
    console.error('❌ OTP Login failed:', error);
    
    // Optional: Send analytics event
    // trackEvent('otp_login_error', { error });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Logo or branding */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">TopAffaireImmo</h1>
            <p className="text-gray-600 mt-2">Connexion sécurisée par SMS</p>
          </div>

          {/* OTP Login Component */}
          <OTPLogin onSuccess={handleSuccess} onError={handleError} />

          {/* Additional links or information */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              En vous connectant, vous acceptez nos{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                conditions d'utilisation
              </a>{' '}
              et notre{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                politique de confidentialité
              </a>
              .
            </p>
          </div>
        </div>

        {/* Debug info (remove in production) */}
        {authState.token && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-xs">
            <p className="font-semibold text-green-800">Authentication State:</p>
            <pre className="mt-2 text-green-700 overflow-auto">
              {JSON.stringify(authState, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Alternative: Minimal integration in existing auth flow
 * 
 * If you already have a login page and want to add OTP as an option:
 */
export function ExistingLoginPageExample() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');

  return (
    <div className="login-page">
      {/* Method selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setLoginMethod('email')}
          className={`flex-1 py-2 px-4 rounded ${
            loginMethod === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Email
        </button>
        <button
          onClick={() => setLoginMethod('otp')}
          className={`flex-1 py-2 px-4 rounded ${
            loginMethod === 'otp' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          SMS
        </button>
      </div>

      {/* Conditional rendering based on method */}
      {loginMethod === 'email' ? (
        <div>{/* Your existing email login form */}</div>
      ) : (
        <OTPLogin
          onSuccess={(token, phone) => {
            console.log('OTP login successful', { token, phone });
            // Handle success
          }}
          onError={(error) => {
            console.error('OTP login failed', error);
            // Handle error
          }}
        />
      )}
    </div>
  );
}

/**
 * Utility: Check if user is authenticated
 */
export function useOTPAuth() {
  const token = localStorage.getItem('otp_auth_token');
  const phone = localStorage.getItem('otp_auth_phone');

  return {
    isAuthenticated: !!token,
    token,
    phone,
    logout: () => {
      localStorage.removeItem('otp_auth_token');
      localStorage.removeItem('otp_auth_phone');
    },
  };
}

/**
 * Example protected route component
 */
export function ProtectedOTPRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useOTPAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return <>{children}</>;
}
