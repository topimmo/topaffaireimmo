import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type ActiveBannerRow = {
  id: string;
  banner_image_url: string | null;
  target_url: string | null;
  company_name: string | null;
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
        .gte("end_date", now)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.log("[BannerSlot] fetch error:", error);
        setActiveBanner(null);
      } else {
        // Debug (خليه ولا حيدو)
        // console.log("[BannerSlot] data:", data);

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

  // ✅ خاص البيانات تكون كاملة باش نعرضو الصورة
  const img = activeBanner?.banner_image_url ?? null;
  const url = activeBanner?.target_url ?? null;
  const name = activeBanner?.company_name ?? "Advertisement";

  if (img && url) {
    return (
      <div className={`banner-slot ${className}`}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block"
        >
          <img
            src={img}
            alt={name}
            className="w-full h-auto rounded-lg"
            loading="lazy"
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
