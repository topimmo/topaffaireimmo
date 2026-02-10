import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Plus } from "lucide-react";

export default function MobileFAB() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const { role } = useUserRole();
  
  // Never show on these paths
  const hiddenPaths = [
    "/add-listing",
    "/edit-listing",
    "/login",
    "/register",
    "/",
    "/search",
    "/services",
    "/property",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/guides",
    "/agencies",
    "/advertise",
  ];
  
  // Check if current path matches any hidden path
  const shouldHide = hiddenPaths.some(path => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  });
  
  if (shouldHide) {
    return null;
  }

  // Show only when authenticated
  if (!user) {
    return null;
  }

  // Show only on these specific paths for agents/merchants
  const showOnPaths = ['/dashboard', '/agent', '/merchant'];
  const shouldShow = showOnPaths.includes(location.pathname);
  
  if (!shouldShow) {
    return null;
  }

  // Hide for regular users - only show for agent/merchant
  if (role === 'user' || role === 'admin') {
    return null;
  }

  return (
    <Link
      to="/add-listing"
      className={`md:hidden fixed z-40 rounded-full bg-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95 ${
        isRTL ? 'left-4' : 'right-4'
      }`}
      style={{
        width: '56px',
        height: '56px',
        // Proper bottom spacing with safe area for iOS/Android
        bottom: 'calc(1.25rem + env(safe-area-inset-bottom))'
      }}
      aria-label={t('nav.addListing')}
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
