import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import BannerSlot from "@/components/advertising/BannerSlot";
import AdSenseBanner from "@/components/advertising/AdSenseBanner";

interface AdBannerProps {
  className?: string;
  page?: string;
  position?: string;
}

// Admin route prefix - ads are disabled on admin routes to prevent UI blocking
const ADMIN_ROUTE_PREFIX = '/admin';

export default function AdBanner({ 
  className, 
  page = 'home', 
  position = 'after_featured' 
}: AdBannerProps) {
  const location = useLocation();
  
  // Disable ads on /admin routes to prevent UI blocking
  if (location.pathname.startsWith(ADMIN_ROUTE_PREFIX)) {
    return null;
  }
  
  return (
    <section className={cn("py-4 md:py-6", className)}>
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
