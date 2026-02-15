import { useState } from 'react';
import './OTPAuth.css';

const API_URL = 'http://localhost:3001';

interface User {
  id: string;
  phone: string;
  createdAt: string;
}

export function OTPAuth() {
  const [step, setStep] = useState<'phone' | 'verify' | 'success'>('phone');
  const [phone, setPhone] = useState('+212');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState('');

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/otp/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('verify');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code: otp }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        setStep('success');
        
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Ensure it starts with +212
    if (!value.startsWith('+212')) {
      value = '+212';
    }
    
    // Remove any non-digit characters except the leading +
    value = '+212' + value.slice(4).replace(/\D/g, '');
    
    setPhone(value);
  };

  const reset = () => {
    setStep('phone');
    setPhone('+212');
    setOtp('');
    setError('');
    setUser(null);
    setToken('');
  };

  if (step === 'success') {
    return (
      <div className="otp-auth-container">
        <div className="otp-auth-card success">
          <div className="success-icon">✓</div>
          <h2>Authentification réussie!</h2>
          <p>Bienvenue sur TopAffaireImmo</p>
          
          <div className="user-info">
            <p><strong>Téléphone:</strong> {user?.phone}</p>
            <p><strong>ID:</strong> {user?.id}</p>
          </div>

          <div className="token-display">
            <p><strong>Token JWT:</strong></p>
            <code>{token.slice(0, 50)}...</code>
          </div>

          <button onClick={reset} className="btn-secondary">
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="otp-auth-container">
        <div className="otp-auth-card">
          <h2>Vérifier le code</h2>
          <p>
            Entrez le code à 6 chiffres envoyé au<br />
            <strong>{phone}</strong>
          </p>

          <form onSubmit={verifyOTP}>
            <div className="otp-input-group">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength={6}
                className="otp-input"
                autoFocus
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="btn-link"
            >
              Changer le numéro
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-auth-container">
      <div className="otp-auth-card">
        <h1>TopAffaireImmo</h1>
        <h2>Connexion par téléphone</h2>
        <p>Entrez votre numéro de téléphone marocain</p>

        <form onSubmit={requestOTP}>
          <div className="phone-input-group">
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+2126XXXXXXXX"
              className="phone-input"
              autoFocus
              required
            />
          </div>

          <p className="hint">Format: +212 6XX XXX XXX</p>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading || phone.length < 13}
          >
            {loading ? 'Envoi...' : 'Recevoir le code'}
          </button>
        </form>

        <div className="info-box">
          <p>
            <strong>Nouveau sur TopAffaireImmo?</strong><br />
            Pas de problème! Un compte sera créé automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}
