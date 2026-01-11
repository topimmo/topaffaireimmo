import { useState, useEffect } from 'react';
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
  adSenseFallback?: React.ReactNode;
}

export default function BannerSlot({ page, position, className = '', adSenseFallback }: BannerSlotProps) {
  const [activeBanner, setActiveBanner] = useState<ActiveBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveBanner();
  }, [page, position]);

  const fetchActiveBanner = async () => {
    setLoading(true);
    
    const now = new Date().toISOString();
    
    const { data } = await supabase
      .from('banner_requests')
      .select(`
        id,
        banner_image_url,
        target_url,
        company_name,
        slot:banner_slots!inner(page, position)
      `)
      .eq('status', 'active')
      .eq('slot.page', page)
      .eq('slot.position', position)
      .lte('start_date', now)
      .gte('end_date', now)
      .limit(1)
      .single();

    if (data) {
      setActiveBanner(data as unknown as ActiveBanner);
    } else {
      setActiveBanner(null);
    }
    
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  // If there's an active direct banner, show it
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

  // Fallback to AdSense if provided
  if (adSenseFallback) {
    return <div className={`banner-slot ${className}`}>{adSenseFallback}</div>;
  }

  return null;
}
