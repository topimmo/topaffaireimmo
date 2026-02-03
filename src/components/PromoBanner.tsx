import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

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
  position: 'home-top' | 'home-middle' | 'listing-top';
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

      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('position', position)
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" - not an error
        console.error('Error loading promo banner:', error);
        return;
      }

      setBanner(data || null);
    } catch (error) {
      console.error('Error loading promo banner:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !banner) {
    return null;
  }

  const BannerContent = () => (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <img
        src={banner.image_url}
        alt={banner.title}
        className="w-full h-auto object-cover"
        loading="lazy"
      />
    </div>
  );

  if (banner.link_url) {
    return (
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:opacity-90 transition-opacity"
      >
        <BannerContent />
      </a>
    );
  }

  return <BannerContent />;
}
