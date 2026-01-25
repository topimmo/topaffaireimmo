import { jsx as _jsx } from "react/jsx-runtime";
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
    return (_jsx(Link, { to: "/add-listing", className: `md:hidden fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95`, "aria-label": t('nav.addListing'), children: _jsx(Plus, { className: "h-6 w-6" }) }));
}
