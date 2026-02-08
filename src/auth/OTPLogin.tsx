/**
 * OTP Login Component
 * 
 * Provides a phone-based authentication flow using SMS OTP.
 * Two-step process:
 * 1. User enters phone number and requests OTP
 * 2. User enters OTP code to verify and receive JWT token
 */

import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface OTPLoginProps {
  onSuccess?: (token: string, phone: string) => void;
  onError?: (error: string) => void;
}

export function OTPLogin({ onSuccess, onError }: OTPLoginProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setMessage(data.message || 'OTP sent successfully');
      setStep('verify');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code: otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      setMessage(data.message || 'Verification successful');
      onSuccess?.(data.token, data.phone);
      
      // Store token in localStorage
      localStorage.setItem('otp_auth_token', data.token);
      localStorage.setItem('otp_auth_phone', data.phone);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid OTP';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setMessage('');
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Connexion par SMS</h2>
        <p className="text-sm text-gray-600">
          {step === 'phone'
            ? 'Entrez votre numéro de téléphone marocain pour recevoir un code de vérification.'
            : 'Entrez le code à 6 chiffres envoyé à votre téléphone.'}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
          {message}
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleRequestOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+212 6XX XXX XXX ou 06XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
              className="text-lg"
            />
            <p className="text-xs text-gray-500">
              Format: +212XXXXXXXXX, 06XXXXXXXX ou 07XXXXXXXX
            </p>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Envoi en cours...' : 'Envoyer le code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Code de vérification</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              disabled={loading}
              className="text-lg text-center tracking-widest"
              maxLength={6}
            />
            <p className="text-xs text-gray-500">Code à 6 chiffres</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="flex-1"
            >
              Retour
            </Button>
            <Button type="submit" disabled={loading || otp.length !== 6} className="flex-1">
              {loading ? 'Vérification...' : 'Vérifier'}
            </Button>
          </div>
          <Button
            type="button"
            variant="link"
            onClick={() => {
              setStep('phone');
              setOtp('');
            }}
            disabled={loading}
            className="w-full text-sm"
          >
            Renvoyer le code
          </Button>
        </form>
      )}
    </div>
  );
}

/**
 * Example usage:
 * 
 * ```tsx
 * import { OTPLogin } from './auth/OTPLogin';
 * 
 * function LoginPage() {
 *   const handleSuccess = (token: string, phone: string) => {
 *     console.log('Login successful!', { token, phone });
 *     // Redirect to dashboard or home page
 *     navigate('/dashboard');
 *   };
 * 
 *   const handleError = (error: string) => {
 *     console.error('Login failed:', error);
 *   };
 * 
 *   return (
 *     <div className="min-h-screen flex items-center justify-center p-4">
 *       <OTPLogin onSuccess={handleSuccess} onError={handleError} />
 *     </div>
 *   );
 * }
 * ```
 */
