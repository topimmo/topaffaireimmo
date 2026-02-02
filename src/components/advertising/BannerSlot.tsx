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
        // Silent fallback - don't spam console with 406 errors
        if (error.code !== 'PGRST116') {
          console.warn("[BannerSlot] fetch error:", error.message);
        }
        setActiveBanner(null);
      } else {
        setActiveBanner((data as ActiveBannerRow) ?? null);
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
