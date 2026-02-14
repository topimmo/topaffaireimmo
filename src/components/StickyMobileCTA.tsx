import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface StickyMobileCTAProps {
  className?: string;
}

export default function StickyMobileCTA({ className }: StickyMobileCTAProps) {
  const { isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Determine CTA based on current page
  const isPropertyPage = location.pathname.includes('/property/') || 
                          location.pathname.includes('/buy') || 
                          location.pathname.includes('/rent') ||
                          location.pathname === '/search';
  
  const isServicesPage = location.pathname.includes('/services') || 
                          location.pathname.includes('/artisan');

  // Don't show on certain pages
  const shouldHide = location.pathname.includes('/login') ||
                      location.pathname.includes('/register') ||
                      location.pathname.includes('/dashboard') ||
                      location.pathname.includes('/admin') ||
                      location.pathname.includes('/add-listing');

  useEffect(() => {
    if (shouldHide) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, shouldHide]);

  if (shouldHide) return null;

  const handleClick = () => {
    if (isPropertyPage) {
      navigate('/add-listing');
    } else if (isServicesPage) {
      navigate('/services');
    } else {
      navigate('/add-listing');
    }
  };

  const getCTAText = () => {
    if (isPropertyPage) {
      return isRTL ? "نشر إعلان" : "Publier une annonce";
    } else if (isServicesPage) {
      return isRTL ? "ابحث عن حرفي" : "Trouver un Artisan";
    } else {
      return isRTL ? "نشر إعلان" : "Publier une annonce";
    }
  };

  const getIcon = () => {
    if (isServicesPage) {
      return Search;
    }
    return Plus;
  };

  const Icon = getIcon();

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full",
        className
      )}
    >
      {/* Gradient overlay for smooth blend */}
      <div className="absolute inset-x-0 bottom-full h-12 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
      
      <div className="bg-background/95 backdrop-blur-md border-t border-border/50 shadow-2xl">
        <div className="container py-3 px-4">
          <Button
            onClick={handleClick}
            size="lg"
            className={cn(
              "w-full rounded-xl font-semibold text-base h-12",
              "shadow-lg hover:shadow-xl",
              "bg-gradient-to-r from-primary to-primary/90",
              "hover:from-primary/90 hover:to-primary",
              "active:scale-[0.98] transition-all duration-200",
              "gap-2"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{getCTAText()}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
