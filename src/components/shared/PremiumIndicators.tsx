import { cn } from '@/lib/utils';

interface FeaturedRibbonProps {
  label?: string;
  className?: string;
}

export function FeaturedRibbon({ label = 'Premium', className }: FeaturedRibbonProps) {
  return (
    <div className={cn('absolute -top-1 -right-1 z-10', className)}>
      <div className="relative">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-8 py-1.5 transform rotate-45 translate-x-6 -translate-y-1 shadow-lg">
          {label}
        </div>
        <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-6 py-1 transform rotate-45 origin-top-right absolute top-[14px] -right-[8px] shadow-lg">
            ⭐ {label}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BoostGlowWrapperProps {
  isBoosted: boolean;
  children: React.ReactNode;
  className?: string;
}

export function BoostGlowWrapper({ isBoosted, children, className }: BoostGlowWrapperProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl',
      isBoosted && 'premium-glow premium-glow-pulse',
      className
    )}>
      {isBoosted && (
        <div className="absolute -top-1 -right-1 z-10 overflow-hidden w-24 h-24">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider text-center py-1 transform rotate-45 translate-x-1 translate-y-5 shadow-lg w-32">
            ⭐ Premium
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

interface PremiumArtisanBorderProps {
  children: React.ReactNode;
  isPremium: boolean;
  className?: string;
}

export function PremiumArtisanBorder({ children, isPremium, className }: PremiumArtisanBorderProps) {
  return (
    <div className={cn(
      'rounded-xl transition-all',
      isPremium && 'ring-2 ring-[#0FC2C0] shadow-[0_0_16px_rgba(15,194,192,0.3)]',
      className
    )}>
      {children}
    </div>
  );
}
