import { cn } from "@/lib/utils";
import BannerSlot from "@/components/advertising/BannerSlot";
import AdSenseBanner from "@/components/advertising/AdSenseBanner";

interface AdBannerProps {
  className?: string;
  page?: string;
  position?: string;
}

export default function AdBanner({ className, page = 'home', position = 'after_featured' }: AdBannerProps) {
  return (
    <section className={cn("py-8 md:py-12", className)}>
      <div className="container">
        <BannerSlot
          page={page}
          position={position}
          className="rounded-xl overflow-hidden"
          adSenseFallback={
            <AdSenseBanner slot="home-middle" format="horizontal" />
          }
        />
      </div>
    </section>
  );
}
