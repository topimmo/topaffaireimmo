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
      const now = new Date().toISOString();

      // Build the query with proper date range filtering
      let query = supabase
        .from('promo_banners')
        .select('*')
        .eq('position', position)
        .eq('is_active', true);

      // The RLS policy already handles date filtering, but we can add it here too for clarity
      // Filter: (starts_at IS NULL OR starts_at <= now) AND (ends_at IS NULL OR ends_at >= now)
      // Note: Supabase RLS handles this, so we rely on that for date filtering

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

      if (error) {
        // Log error but don't block the page - promo banners are optional
        console.warn(`[PromoBanner] Failed to load banner for position "${position}":`, error.message);
        // If table doesn't exist (PGRST205 or PostgreSQL error 42P01), gracefully continue without banner
        if (error.code === 'PGRST205' || error.code === '42P01' || error.message.includes('promo_banners')) {
          console.warn('[PromoBanner] promo_banners table may not exist - this is non-critical');
        }
        setBanner(null);
        return;
      }

      setBanner(data || null);
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
