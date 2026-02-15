import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Wrench, Home, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

type AccountType = 'user' | 'artisan';

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name) e.name = 'Le nom est requis';
    if (!formData.email) e.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email invalide';
    if (!formData.phone) e.phone = 'Le téléphone est requis';
    if (!formData.password) e.password = 'Le mot de passe est requis';
    else if (formData.password.length < 8) e.password = '8 caractères minimum';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!agreed) e.agreed = 'Vous devez accepter les conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const passwordStrength = () => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strength = passwordStrength();
  const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Fort'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-green-400', 'bg-green-500'][strength];

  return (
    <div className="min-h-screen bg-[#0A1F2E] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 noise-texture" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
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
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Créer un compte</h1>
              <p className="text-gray-400">Rejoignez la communauté TopAffaireImmo</p>
            </div>

            {/* Account Type Toggle */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setAccountType('user')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                  accountType === 'user'
                    ? 'border-[#0FC2C0] bg-[#0FC2C0]/10 text-[#0FC2C0]'
                    : 'border-[#2A3F4C] text-gray-400 hover:border-gray-500'
                )}
              >
                <Home className="h-6 w-6" />
                <div>
                  <p className="text-sm font-medium">Utilisateur</p>
                  <p className="text-xs text-gray-500">Acheteur / Agent</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('artisan')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                  accountType === 'artisan'
                    ? 'border-[#0FC2C0] bg-[#0FC2C0]/10 text-[#0FC2C0]'
                    : 'border-[#2A3F4C] text-gray-400 hover:border-gray-500'
                )}
              >
                <Wrench className="h-6 w-6" />
                <div>
                  <p className="text-sm font-medium">Artisan</p>
                  <p className="text-xs text-gray-500">Professionnel</p>
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="Votre nom complet" className={cn('pl-10 bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500', errors.name && 'border-red-500')} />
                </div>
                {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input value={formData.email} onChange={e => updateField('email', e.target.value)} type="email" placeholder="votre@email.com" className={cn('pl-10 bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500', errors.email && 'border-red-500')} />
                </div>
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input value={formData.phone} onChange={e => updateField('phone', e.target.value)} type="tel" placeholder="+212 6XX XXX XXX" className={cn('pl-10 bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500', errors.phone && 'border-red-500')} />
                </div>
                {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input value={formData.password} onChange={e => updateField('password', e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className={cn('pl-10 pr-10 bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500', errors.password && 'border-red-500')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={cn('h-1 flex-1 rounded-full', i <= strength ? strengthColor : 'bg-[#2A3F4C]')} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">Force: {strengthLabel}</p>
                  </div>
                )}
                {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} type="password" placeholder="••••••••" className={cn('pl-10 bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500', errors.confirmPassword && 'border-red-500')} />
                  {formData.confirmPassword && formData.confirmPassword === formData.password && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />
                  )}
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); if (errors.agreed) setErrors(p => ({ ...p, agreed: '' })); }} className="mt-1 rounded border-[#2A3F4C] bg-[#0A1F2E] text-[#0FC2C0]" />
                <p className="text-xs text-gray-400">
                  J'accepte les{' '}
                  <a href="#" className="text-[#0FC2C0] hover:underline">conditions d'utilisation</a>
                  {' '}et la{' '}
                  <a href="#" className="text-[#0FC2C0] hover:underline">politique de confidentialité</a>
                </p>
              </div>
              {errors.agreed && <p className="text-xs text-red-400">{errors.agreed}</p>}

              <Button type="submit" disabled={isLoading || !agreed} className="w-full bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-semibold h-11 shadow-lg disabled:opacity-50">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Inscription...</>
                ) : (
                  `Créer mon compte ${accountType === 'artisan' ? 'artisan' : ''}`
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-[#0FC2C0] font-medium hover:underline">Se connecter</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
