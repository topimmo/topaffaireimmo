import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

type AdVariant = 'banner' | 'infeed' | 'sidebar' | 'mobileSticky';

interface AdSlotProps {
  variant: AdVariant;
  slotId: string;
  className?: string;
}

const variantConfig: Record<AdVariant, { height: string; label: string }> = {
  banner: { height: 'h-[90px] md:h-[120px]', label: 'Annonce' },
  infeed: { height: 'h-[250px]', label: 'Contenu sponsorisé' },
  sidebar: { height: 'h-[300px]', label: 'Annonce' },
  mobileSticky: { height: 'h-[60px]', label: 'Annonce' },
};

export function AdSlot({ variant, slotId, className }: AdSlotProps) {
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const config = variantConfig[variant];

  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate ad load — in production, detect real ad blocker
      setLoaded(true);
      // Simulate 20% chance of ad block for demo
      if (Math.random() < 0.0) setBlocked(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      data-ad-slot={slotId}
      className={cn(
        'relative overflow-hidden rounded-lg border border-[#2A3F4C]/50',
        config.height,
        className
      )}
    >
      {!loaded ? (
        <Skeleton className="w-full h-full bg-[#1B2F3C]" />
      ) : blocked ? (
        <div className="w-full h-full flex items-center justify-center bg-[#1B2F3C]/30 backdrop-blur-sm">
          <p className="text-xs text-gray-500">Espace publicitaire</p>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-[#1B2F3C]/40 to-[#0A1F2E]/40 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-8 h-8 rounded bg-[#2A3F4C] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="#4A5F6C" strokeWidth="1.5" />
                <circle cx="6" cy="6" r="1.5" fill="#4A5F6C" />
                <path d="M2 12l4-4 2 2 4-6" stroke="#4A5F6C" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          <span className="text-[10px] font-medium text-gray-500 tracking-widest uppercase">
            {config.label}
          </span>
        </div>
      )}
    </div>
  );
}
