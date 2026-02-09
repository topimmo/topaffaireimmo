import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import PromoSlot from '@/components/PromoSlot';

interface PromoBanner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

interface PromoBannerProps {
  position: 'home-top' | 'home-middle' | 'listing-top' | 'agencies-top';
  className?: string;
}

export default function PromoBanner({ position, className }: PromoBannerProps) {
  const [banner, setBanner] = useState<PromoBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanner();
  }, [position]);

  const loadBanner = async () => {
    try {
      // Note: promo_banners table does not exist in the current schema
      // This component is kept for backward compatibility but returns null
      setBanner(null);
    } catch (error) {
      // Catch any unexpected errors and continue gracefully
      console.warn('[PromoBanner] Unexpected error loading promo banner:', error);
      setBanner(null);
    } finally {
      // ALWAYS set loading to false to prevent blocking the UI
      setLoading(false);
    }
  };

  if (loading || !banner) {
    return null;
  }

  const BannerContent = () => (
    <div className="relative overflow-hidden rounded-lg shadow-sm">
      <img
        src={banner.image_url}
        alt={banner.title}
        className="w-full h-auto object-cover"
        loading="lazy"
      />
    </div>
  );

  const content = banner.link_url ? (
    <a
      href={banner.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block hover:opacity-90 transition-opacity"
    >
      <BannerContent />
    </a>
  ) : (
    <BannerContent />
  );

  return (
    <PromoSlot className={className} emptyBehavior="collapse">
      {content}
    </PromoSlot>
  );
}
