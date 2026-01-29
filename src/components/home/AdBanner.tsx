import { cn } from "@/lib/utils";
import BannerSlot from "@/components/advertising/BannerSlot";
import AdSenseBanner from "@/components/advertising/AdSenseBanner";

interface AdBannerProps {
  className?: string;

  /**
   * Must match public.banner_slots.page
   * examples: "home" | "search" | "property"
   */
  page?: "home" | "search" | "property";

  /**
   * Must match public.banner_slots.position
   * examples: "hero" | "middle" | "sidebar" | "top" | "bottom"
   */
  position?: "hero" | "middle" | "sidebar" | "top" | "bottom";

  /**
   * optional: AdSense slot key (if you use AdSense fallback)
   */
  adSenseSlot?: string;
}

export default function AdBanner({
  className,
  page = "home",
  position = "middle",
  adSenseSlot,
}: AdBannerProps) {
  // AdSense fallback slot name (keep your naming convention)
  const fallbackSlot =
    adSenseSlot ?? `${page}-${position}`; // example: "home-middle"

  return (
    <section className={cn("py-8 md:py-12", className)}>
      <div className="container">
        <BannerSlot
          page={page}
          position={position}
          className="rounded-xl overflow-hidden"
          adSenseFallback={<AdSenseBanner slot={fallbackSlot} format="horizontal" />}
        />
      </div>
    </section>
  );
}
