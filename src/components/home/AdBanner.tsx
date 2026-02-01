import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import BannerSlot from "@/components/advertising/BannerSlot";
import AdSenseBanner from "@/components/advertising/AdSenseBanner";

interface AdBannerProps {
  className?: string;
  page?: string;
  position?: string;
}

export default function AdBanner({ 
  className, 
  page = 'home', 
  position = 'after_featured' 
}: AdBannerProps) {
  const location = useLocation();
  
  // Disable ads on /admin routes to prevent UI blocking
  if (location.pathname.startsWith('/admin')) {
    return null;
  }
  
  return (
    <section 
      className={cn("py-4 md:py-6", className)}
      style={{
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div 
        className="container"
        style={{
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
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
