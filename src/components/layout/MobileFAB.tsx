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
      className={`md:hidden fixed z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95 ${
        isRTL ? 'left-6' : 'right-6'
      }`}
      style={{
        // Use safe-area-inset-bottom for iOS/Android notch support
        bottom: 'calc(1.5rem + env(safe-area-inset-bottom))'
      }}
      aria-label={t('nav.addListing')}
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
