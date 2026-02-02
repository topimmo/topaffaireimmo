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

export default function AdBanner({ 
  className, 
  page = 'home', 
  position = 'after_featured' 
}: AdBannerProps) {
  const location = useLocation();
  
  // CRITICAL ENFORCEMENT #1: Disable ads on /admin routes to prevent UI blocking and banner fetching
  if (location.pathname.startsWith(ADMIN_ROUTE_PREFIX)) {
    return null;
  }
  
  // CRITICAL ENFORCEMENT #2: Disable header banners globally (only allow middle/bottom placements)
  // This is permanent from PR #86 - header ads must NEVER render site-wide
  if (BLOCKED_AD_POSITIONS.includes(position as any)) {
    if (import.meta.env.DEV) {
      console.warn(`[AdBanner] Blocked header position: "${position}" - This is permanent from PR #86`);
    }
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
            <AdSenseBanner 
              slot={`${page}-${position}`}
              format="horizontal"
            />
          }
        />
      </div>
    </section>
  );
}
