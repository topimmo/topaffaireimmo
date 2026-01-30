import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus } from "lucide-react";

export default function MobileFAB() {
  const { t, isRTL } = useLanguage();
  const location = useLocation();
  
  // Don't show on add-listing page
  if (location.pathname === "/add-listing") {
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
