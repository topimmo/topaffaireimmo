import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface ActiveBanner {
  id: string;
  banner_image_url: string;
  target_url: string;
  company_name: string;
}

interface BannerSlotProps {
  page: string;
  position: string;
  className?: string;
  adSenseFallback?: ReactNode;
}

export default function BannerSlot({
  page,
  position,
  className = '',
  adSenseFallback,
}: BannerSlotProps) {
  const [activeBanner, setActiveBanner] = useState<ActiveBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveBanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, position]);

  const fetchActiveBanner = async () => {
    setLoading(true);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('banner_requests')
      .select(
        `
        id,
        banner_image_url,
        target_url,
        company_name,
        banner_slots!inner (
          page,
          position
        )
      `
      )
      .eq('status', 'active')
      .eq('banner_slots.page', page)
      .eq('banner_slots.position', position)
      .lte('start_date', now)
      .gte('end_date', now)
      .maybeSingle(); // ✅ مهم: ما كيعطيش 406

    if (error) {
      console.log('[BannerSlot] fetch error:', error);
      setActiveBanner(null);
    } else {
      setActiveBanner((data as ActiveBanner) ?? null);
    }

    setLoading(false);
  };

  if (loading) return null;

  // ✅ إعلان مباشر (Direct banner)
  if (activeBanner) {
    return (
      <div className={`banner-slot ${className}`}>
        <a
          href={activeBanner.target_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block"
        >
          <img
            src={activeBanner.banner_image_url}
            alt={activeBanner.company_name}
            className="w-full h-auto rounded-lg"
          />
        </a>
      </div>
    );
  }

  // ✅ Fallback AdSense
  if (adSenseFallback) {
    return <div className={`banner-slot ${className}`}>{adSenseFallback}</div>;
  }

  return null;
}
