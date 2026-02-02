import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type ActiveBannerRow = {
  id: string;
  banner_image_url: string | null;
  target_url: string | null;
  company_name: string | null;
  created_at?: string | null;
  slot?: {
    page: string | null;
    position: string | null;
  } | null;
};

interface BannerSlotProps {
  page: string;
  position: string;
  className?: string;
  adSenseFallback?: ReactNode;
}

/**
 * CRITICAL: Header ad positions that must NEVER render
 * This is a permanent enforcement from PR #86
 * DO NOT modify or remove these restrictions
 */
const BLOCKED_AD_POSITIONS = [
  'header',
  'after_header',
  'hero',
  'top',
] as const;

const normalizeUrl = (u: string) => {
  const clean = u.trim();
  if (!clean) return clean;
  return clean.startsWith("http://") || clean.startsWith("https://")
    ? clean
    : `https://${clean}`;
};

export default function BannerSlot({
  page,
  position,
  className = "",
  adSenseFallback,
}: BannerSlotProps) {
  const [activeBanner, setActiveBanner] = useState<ActiveBannerRow | null>(null);
  const [loading, setLoading] = useState(true);

  // CRITICAL ENFORCEMENT: Block header/top positions globally (only allow middle/bottom)
  // This is permanent from PR #86 - header ads must NEVER render site-wide
  const isBlockedPosition = BLOCKED_AD_POSITIONS.includes(position as any);
  
  if (isBlockedPosition) {
    if (import.meta.env.DEV) {
      console.warn(`[BannerSlot] Blocked header position: "${position}" - This is permanent from PR #86`);
    }
    return null;
  }

  useEffect(() => {
    let mounted = true;

    const fetchActiveBanner = async () => {
      setLoading(true);
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("banner_requests")
        .select(
          `
            id,
            banner_image_url,
            target_url,
            company_name,
            created_at,
            slot:banner_slots!inner(
              page,
              position
            )
          `
        )
        .eq("status", "active")
        .eq("slot.page", page)
        .eq("slot.position", position)
        .lte("start_date", now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        // CRITICAL: Silent fallback for 406 errors (PR #86 enforcement)
        // PGRST116 = "The result contains 0 rows" - this is expected and should not spam console
        // This prevents noise when banner slots don't have active campaigns
        if (error.code !== 'PGRST116') {
          console.warn("[BannerSlot] fetch error:", error.message);
        }
        setActiveBanner(null);
      } else {
        // Supabase returns nested arrays for joined relations when using inner join
        // Cast to unknown first to satisfy TypeScript since the actual shape may vary
        setActiveBanner((data as unknown as ActiveBannerRow) ?? null);
      }

      setLoading(false);
    };

    fetchActiveBanner();

    return () => {
      mounted = false;
    };
  }, [page, position]);

  if (loading) return null;

  const imgRaw = activeBanner?.banner_image_url ?? "";
  const urlRaw = activeBanner?.target_url ?? "";
  const name = activeBanner?.company_name?.trim() || "Advertisement";

  const img = imgRaw.trim();
  const url = urlRaw.trim();

  // ✅ إذا كاينة الصورة => عرضها (بالرابط إذا كاين)
  if (img) {
    const imageEl = (
      <img
        src={normalizeUrl(img)}
        alt={name}
        className="w-full h-auto rounded-lg"
        loading="lazy"
      />
    );

    return (
      <div className={`banner-slot ${className}`}>
        {url ? (
          <a
            href={normalizeUrl(url)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block"
          >
            {imageEl}
          </a>
        ) : (
          <div className="block">{imageEl}</div>
        )}
      </div>
    );
  }

  // ✅ Fallback AdSense
  if (adSenseFallback) {
    return <div className={`banner-slot ${className}`}>{adSenseFallback}</div>;
  }

  return null;
}
