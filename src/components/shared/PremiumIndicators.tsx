import { cn } from '@/lib/utils';

// FULL FREE MODE: Premium indicators disabled
// These components are kept for compatibility but render nothing

interface FeaturedRibbonProps {
  label?: string;
  className?: string;
}

export function FeaturedRibbon({ label = 'Premium', className }: FeaturedRibbonProps) {
  // FULL FREE MODE: Do not render premium ribbon
  return null;
}

interface BoostGlowWrapperProps {
  isBoosted: boolean;
  children: React.ReactNode;
  className?: string;
}

export function BoostGlowWrapper({ isBoosted, children, className }: BoostGlowWrapperProps) {
  // FULL FREE MODE: Render children without any premium styling
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
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
  // FULL FREE MODE: Render children without premium border
  return (
    <div className={cn('rounded-xl transition-all', className)}>
      {children}
    </div>
  );
}
