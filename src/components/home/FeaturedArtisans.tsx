import { useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFeaturedArtisans } from "@/hooks/useArtisans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Sparkles, Star, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FeaturedArtisans() {
  const { t, isRTL, language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { artisans, loading } = useFeaturedArtisans(6);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const actualDirection = isRTL 
        ? (direction === "left" ? "right" : "left") 
        : direction;
      scrollContainerRef.current.scrollBy({
        left: actualDirection === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <section className={`py-20 md:py-24 bg-muted/20 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-3">
              <div className="h-6 w-48 bg-muted/50 rounded animate-pulse" />
              <div className="h-10 w-64 bg-muted/50 rounded animate-pulse" />
              <div className="h-5 w-96 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no artisans
  if (!artisans.length) {
    return null;
  }

  return (
    <section className={`py-20 md:py-24 bg-muted/20 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="section-label text-primary">
                {isRTL ? 'محترفون معتمدون' : 'Professionnels vérifiés'}
              </span>
            </div>
            <h2 className="section-title">
              {isRTL ? 'حرفيونا المميزون' : 'Nos Meilleurs Artisans'}
            </h2>
            <p className="section-subtitle max-w-xl">
              {isRTL 
                ? 'محترفون موثوقون ومعتمدون، مستعدون لخدمتك'
                : 'Professionnels vérifiés recommandés pour vous'}
            </p>
          </div>

          {/* Navigation Buttons */}
          {artisans.length > 3 && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left")}
                className="rounded-full h-11 w-11 border-2 hover:border-primary hover:text-primary hover:bg-primary/5 hover:shadow-md transition-all duration-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right")}
                className="rounded-full h-11 w-11 border-2 hover:border-primary hover:text-primary hover:bg-primary/5 hover:shadow-md transition-all duration-300"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Artisan Cards Grid/Carousel */}
        <div
          ref={scrollContainerRef}
          className={cn(
            "grid gap-6 pb-4",
            artisans.length > 3 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:flex xl:overflow-x-auto xl:snap-x xl:snap-mandatory scrollbar-hide"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}
          style={artisans.length > 3 ? { scrollbarWidth: "none", msOverflowStyle: "none" } : {}}
        >
          {artisans.map((artisan, index) => {
            const categoryName = language === 'ar' 
              ? artisan.service_category?.name_ar 
              : artisan.service_category?.name_fr;
            
            const subcategories = artisan.artisan_services?.slice(0, 3) || [];
            const rating = artisan.profiles?.rating || 0;
            const completedJobs = artisan.profiles?.completed_jobs || 0;
            
            // Get initials for avatar fallback
            const initials = artisan.business_name
              .split(' ')
              .map(word => word[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);

            return (
              <Card
                key={artisan.id}
                className={cn(
                  "overflow-hidden bg-card border border-border/50 transition-all duration-300 rounded-xl hover-lift-strong",
                  artisans.length > 3 && "flex-shrink-0 w-[320px] md:w-[340px] snap-start"
                )}
              >
                <div className="p-6 space-y-4">
                  {/* Top Row: Avatar + Verified Badge */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                      <AvatarImage 
                        src={artisan.avatar_url} 
                        alt={artisan.business_name}
                        loading="lazy"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-lg text-foreground line-clamp-1">
                        {artisan.business_name}
                      </h3>
                      {artisan.is_verified && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">
                            {isRTL ? 'معتمد' : 'Vérifié'}
                          </span>
                        </div>
                      )}
                    </div>

                    {artisan.is_boosted && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 gap-1">
                        <Sparkles className="h-3 w-3" />
                        {isRTL ? 'مميز' : 'Premium'}
                      </Badge>
                    )}
                  </div>

                  {/* Category Badge */}
                  {categoryName && (
                    <Badge variant="secondary" className="font-medium">
                      {categoryName}
                    </Badge>
                  )}

                  {/* Services/Subcategories */}
                  {subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map((service: any) => (
                        <Badge 
                          key={service.service_subcategory.id}
                          variant="outline" 
                          className="text-xs"
                        >
                          {language === 'ar' 
                            ? service.service_subcategory.name_ar 
                            : service.service_subcategory.name_fr}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Rating & Jobs (if available) */}
                  {(rating > 0 || completedJobs > 0) && (
                    <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                      {rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                        </div>
                      )}
                      {completedJobs > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>{completedJobs}</span>
                          <span>{isRTL ? 'مهام' : 'missions'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA Button */}
                  <Link to={`/artisan/${artisan.id}`} className="block">
                    <Button 
                      className="w-full rounded-xl transition-all hover:scale-[1.02]"
                      variant="default"
                    >
                      {isRTL ? 'عرض الملف الشخصي' : 'Voir le profil'}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <Link to="/services">
            <Button variant="outline" size="lg" className="rounded-xl">
              {isRTL ? 'عرض جميع المحترفين' : 'Voir tous les professionnels'}
              <ChevronRight className={cn("h-4 w-4", isRTL ? "mr-2 rotate-180" : "ml-2")} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
