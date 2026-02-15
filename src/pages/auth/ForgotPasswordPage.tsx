import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Loader2, ArrowLeft, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('L\'email est requis'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Email invalide'); return; }
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setSent(true); }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0A1F2E] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 noise-texture" />
      <div className="absolute top-20 left-1/3 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0FC2C0] to-[#0A9D9B] flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="font-bold text-2xl text-white">
              TopAffaire<span className="text-[#0FC2C0]">Immo</span>
            </span>
          </Link>
        </div>

        <Card className="bg-[#1B2F3C] border-[#2A3F4C] shadow-2xl">
          <CardContent className="p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Email envoyé !</h1>
                <p className="text-gray-400 text-sm">
                  Un lien de réinitialisation a été envoyé à <strong className="text-white">{email}</strong>. Vérifiez votre boîte de réception.
                </p>
                <Button onClick={() => setSent(false)} variant="outline" className="border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] hover:text-white">
                  Renvoyer l'email
                </Button>
                <div>
                  <Link to="/login" className="text-sm text-[#0FC2C0] hover:underline">
                    ← Retour à la connexion
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-white mb-2">Mot de passe oublié</h1>
                  <p className="text-gray-400 text-sm">Entrez votre email et nous vous enverrons un lien de réinitialisation</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        type="email"
                        placeholder="votre@email.com"
                        className={`pl-10 bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500 ${error ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {error && <p className="text-xs text-red-400">{error}</p>}
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-semibold h-11">
                    {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi...</> : 'Envoyer le lien'}
                  </Button>
                </form>

                <div className="text-center mt-6">
                  <Link to="/login" className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Retour à la connexion
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
