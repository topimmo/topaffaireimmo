import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Wrench, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GatewayCategory {
  id: string;
  icon: React.ElementType;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  link: string;
  accentColor: string;
  bgGradient: string;
  iconBg: string;
}

const GATEWAY_CATEGORIES: GatewayCategory[] = [
  {
    id: "real-estate",
    icon: Building2,
    titleFr: "Immobilier",
    titleAr: "العقارات",
    descriptionFr: "Achetez, louez ou vendez des propriétés au Maroc",
    descriptionAr: "اشترِ أو استأجر أو بِع العقارات في المغرب",
    link: "/search",
    accentColor: "text-primary",
    bgGradient: "from-primary/5 via-primary/8 to-primary/3",
    iconBg: "bg-primary/12",
  },
  {
    id: "services",
    icon: Wrench,
    titleFr: "Services",
    titleAr: "الخدمات",
    descriptionFr: "Trouvez des professionnels pour votre maison",
    descriptionAr: "ابحث عن محترفين لمنزلك",
    link: "/services",
    accentColor: "text-secondary",
    bgGradient: "from-secondary/5 via-secondary/8 to-secondary/3",
    iconBg: "bg-secondary/12",
  },
];

export default function EntryGateway() {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  const copy = {
    headline: isRTL
      ? "ماذا تبحث عنه اليوم؟"
      : "Que recherchez-vous aujourd'hui ?",
    subheadline: isRTL
      ? "اختر فئة للبدء"
      : "Choisissez une catégorie pour commencer",
    explore: isRTL ? "استكشاف" : "Explorer",
  };

  return (
    <section
      className={cn(
        "relative py-20 md:py-28 px-6 overflow-hidden bg-gradient-to-b from-background via-background/98 to-background"
      )}
    >
      <div className="container mx-auto relative z-10">
        {/* Header - Premium Typography */}
        <div className="text-center mb-16 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent leading-tight">
            {copy.headline}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            {copy.subheadline}
          </p>
        </div>

        {/* Gateway Cards - Premium Grid with auto-fit */}
        <div
          className={cn(
            "grid gap-8 md:gap-10 max-w-5xl mx-auto",
            // Auto-fit grid that adapts to content
            "grid-cols-1 sm:grid-cols-2",
            // When there are more than 2 items, use 3 columns on large screens
            GATEWAY_CATEGORIES.length > 2 && "lg:grid-cols-3",
            // When there are more than 3 items, use 4 columns on xl screens
            GATEWAY_CATEGORIES.length > 3 && "xl:grid-cols-4"
          )}
        >
          {GATEWAY_CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            // Map index to specific delay classes for Tailwind
            const delayClasses = ['', 'delay-100', 'delay-200', 'delay-300'];
            const delayClass = delayClasses[index] || 'delay-300';
            return (
              <button
                key={category.id}
                onClick={() => navigate(category.link)}
                className={cn(
                  "group relative flex flex-col items-center text-center p-10 md:p-12 rounded-2xl",
                  "bg-gradient-to-br border-2 border-border/40 shadow-lg hover:shadow-2xl",
                  "transition-all duration-500 ease-out",
                  "hover:scale-[1.03] hover:border-border hover:-translate-y-1",
                  "animate-in fade-in slide-in-from-bottom-8 duration-700",
                  delayClass,
                  category.bgGradient
                )}
              >
                {/* Icon - Larger & more prominent */}
                <div
                  className={cn(
                    "w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6",
                    category.iconBg,
                    "group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-md"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-10 h-10 md:w-12 md:h-12",
                      category.accentColor
                    )}
                  />
                </div>

                {/* Content - Enhanced Typography */}
                <h3
                  className={cn(
                    "text-2xl md:text-3xl font-bold mb-4 transition-colors duration-300",
                    "text-foreground group-hover:text-foreground"
                  )}
                >
                  {isRTL ? category.titleAr : category.titleFr}
                </h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
                  {isRTL ? category.descriptionAr : category.descriptionFr}
                </p>

                {/* CTA - Premium Button */}
                <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all duration-300">
                  <span>{copy.explore}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
