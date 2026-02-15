import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!password) errs.password = 'Le mot de passe est requis';
    else if (password.length < 8) errs.password = '8 caractères minimum';
    if (password !== confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    
    setIsLoading(true);

    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        setErrors({ general: 'Une erreur est survenue. Veuillez réessayer.' });
        setIsLoading(false);
        return;
      }
      
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Update password error:', err);
      setErrors({ general: 'Une erreur est survenue. Veuillez réessayer.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1F2E] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 noise-texture" />
      <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10" />

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
          <CardContent className="p-8">
            {success ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Mot de passe réinitialisé !</h1>
                <p className="text-gray-400 text-sm">Votre mot de passe a été changé avec succès.</p>
                <Link to="/login">
                  <Button className="w-full bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">Se connecter</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-white mb-2">Réinitialiser le mot de passe</h1>
                  <p className="text-gray-400 text-sm">Choisissez un nouveau mot de passe sécurisé</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {errors.general && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{errors.general}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className={cn('pl-10 pr-10 bg-[#0A1F2E] border-[#2A3F4C] text-white', errors.password && 'border-red-500')} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input value={confirm} onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }} type="password" placeholder="••••••••" className={cn('pl-10 bg-[#0A1F2E] border-[#2A3F4C] text-white', errors.confirm && 'border-red-500')} />
                    </div>
                    {errors.confirm && <p className="text-xs text-red-400">{errors.confirm}</p>}
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-semibold h-11">
                    {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Réinitialisation...</> : 'Réinitialiser'}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
