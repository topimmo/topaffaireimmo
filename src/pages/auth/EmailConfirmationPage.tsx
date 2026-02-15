import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Check, AlertCircle } from 'lucide-react';

export default function EmailConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'error'>('pending');

  useEffect(() => {
    // Get email from location state
    const stateEmail = (location.state as any)?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    }

    // Check if there's a confirmation token in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'signup') {
      // Email confirmed successfully
      setStatus('confirmed');
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [location, navigate]);

  const handleResendEmail = () => {
    // In production, this would call the resend confirmation API
    console.log('Resend confirmation email to:', email);
  };

  return (
    <div className="min-h-screen bg-[#0A1F2E] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 noise-texture" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0FC2C0] to-[#0A9D9B] flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="font-bold text-2xl text-white">TopAffaire<span className="text-[#0FC2C0]">Immo</span></span>
          </Link>
        </div>

        <Card className="bg-[#1B2F3C] border-[#2A3F4C] shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            {status === 'confirmed' ? (
              <>
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">Email confirmé !</h1>
                  <p className="text-gray-400 text-sm">
                    Votre compte a été activé avec succès. Vous allez être redirigé vers la page de connexion.
                  </p>
                </div>
              </>
            ) : status === 'error' ? (
              <>
                <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-red-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">Erreur de confirmation</h1>
                  <p className="text-gray-400 text-sm">
                    Le lien de confirmation n'est plus valide ou a expiré.
                  </p>
                </div>
                <Button onClick={handleResendEmail} className="w-full bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
                  Renvoyer l'email
                </Button>
              </>
            ) : (
              <>
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-[#0FC2C0]/20 animate-ping" />
                  <div className="relative w-20 h-20 rounded-full bg-[#0FC2C0]/20 flex items-center justify-center">
                    <Mail className="h-10 w-10 text-[#0FC2C0]" />
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">Vérifiez votre email</h1>
                  <p className="text-gray-400 text-sm">
                    Nous avons envoyé un lien de confirmation à votre adresse email. Cliquez sur le lien pour activer votre compte.
                  </p>
                </div>

                {email && (
                  <div className="bg-[#0A1F2E] rounded-lg p-4 border border-[#2A3F4C]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#0FC2C0]/15">
                        <Check className="h-4 w-4 text-[#0FC2C0]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">Email envoyé</p>
                        <p className="text-xs text-gray-400">{email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button onClick={handleResendEmail} variant="outline" className="w-full border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] hover:text-white">
                    Renvoyer l'email
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou{' '}
                  <Link to="/login" className="text-[#0FC2C0] hover:underline">retournez à la connexion</Link>.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
