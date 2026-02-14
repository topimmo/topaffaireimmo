import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFeaturedArtisans } from "@/hooks/useArtisans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Sparkles, Star, MapPin, CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Animated star rating component
function AnimatedStarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const isFull = index < fullStars;
        const isHalf = index === fullStars && hasHalfStar;
        
        return (
          <div key={index} className="relative">
            <Star 
              className={cn(
                "h-4 w-4 transition-all duration-300",
                isFull ? "fill-amber-400 text-amber-400 scale-110" : "text-muted-foreground/30"
              )}
            />
            {isHalf && (
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FeaturedArtisans() {
  const { t, isRTL, language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
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
                onMouseEnter={() => setHoveredCard(artisan.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={cn(
                  "group overflow-hidden bg-card border border-border/50 rounded-xl relative",
                  "transition-all duration-500 ease-out",
                  "hover:shadow-2xl hover:scale-[1.03] hover:border-primary/30 hover:-translate-y-1",
                  artisans.length > 3 && "flex-shrink-0 w-[320px] md:w-[340px] snap-start"
                )}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative p-6 space-y-4">
                  {/* Top Row: Avatar + Verified Badge + Availability */}
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 group-hover:scale-110">
                        <AvatarImage 
                          src={artisan.avatar_url} 
                          alt={artisan.business_name}
                          loading="lazy"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {/* Availability indicator */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card shadow-sm animate-pulse" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">
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
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 gap-1 shadow-lg">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        {isRTL ? 'مميز' : 'Premium'}
                      </Badge>
                    )}
                  </div>

                  {/* Availability Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {isRTL ? 'متاح الآن' : 'Disponible maintenant'}
                    </Badge>
                    {categoryName && (
                      <Badge variant="outline" className="font-medium">
                        {categoryName}
                      </Badge>
                    )}
                  </div>

                  {/* Services/Subcategories */}
                  {subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map((service: any) => (
                        <Badge 
                          key={service.service_subcategory.id}
                          variant="outline" 
                          className="text-xs hover:bg-primary/5 transition-colors"
                        >
                          {language === 'ar' 
                            ? service.service_subcategory.name_ar 
                            : service.service_subcategory.name_fr}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Rating & Jobs with animated stars */}
                  {(rating > 0 || completedJobs > 0) && (
                    <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                      {rating > 0 && (
                        <div className="flex items-center gap-2">
                          <AnimatedStarRating rating={rating} />
                          <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
                        </div>
                      )}
                      {completedJobs > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{completedJobs}</span>
                          <span>{isRTL ? 'مهام' : 'missions'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Link to={`/artisan/${artisan.id}`} className="flex-1">
                      <Button 
                        className="w-full rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg"
                        variant="default"
                      >
                        {isRTL ? 'عرض الملف الشخصي' : 'Voir le profil'}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl transition-all duration-300 hover:scale-[1.02] hover:bg-primary/5 hover:border-primary/50"
                      onClick={(e) => {
                        e.preventDefault();
                        // Quick contact action - could open a modal
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
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
