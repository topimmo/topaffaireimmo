import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export default function MobileFAB() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function getUserRole() {
      if (!user) return;

      try {
        // Check if admin
        const { data: adminData } = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (adminData) {
          setUserRole("admin");
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_role, advertiser_type")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          if (profile.user_role === 'commercial_advertiser') {
            setUserRole('merchant');
          } else if (profile.user_role === 'real_estate_advertiser') {
            const advertiserType = profile.advertiser_type;
            if (advertiserType === 'broker') {
              setUserRole('agent');
            } else if (advertiserType === 'agency') {
              setUserRole('merchant');
            } else {
              setUserRole('user');
            }
          } else {
            setUserRole('user');
          }
        }
      } catch (error) {
        console.error("[MobileFAB] Error getting user role:", error);
      }
    }

    getUserRole();
  }, [user]);
  
  // Show FAB ONLY on these paths
  const showOnPaths = ['/dashboard', '/agent', '/merchant'];
  const shouldShow = showOnPaths.includes(location.pathname);
  
  if (!shouldShow) {
    return null;
  }

  // Hide for regular users - only show for agent/merchant who can add listings
  if (userRole === 'user') {
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
