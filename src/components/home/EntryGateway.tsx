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
    bgGradient: "from-primary/5 via-primary/10 to-primary/5",
    iconBg: "bg-primary/10",
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
    bgGradient: "from-secondary/5 via-secondary/10 to-secondary/5",
    iconBg: "bg-secondary/10",
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
        "py-20 md:py-28 bg-gradient-to-b from-background via-muted/20 to-background",
        isRTL && "rtl"
      )}
    >
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5 leading-tight">
            {copy.headline}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">{copy.subheadline}</p>
        </div>

        {/* Gateway Cards - Flexible Grid */}
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
          {GATEWAY_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => navigate(category.link)}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border-2 border-border/40",
                  "bg-card hover:bg-gradient-to-br",
                  category.bgGradient,
                  "p-10 md:p-12 text-start transition-all duration-500",
                  "hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 hover:scale-105",
                  "focus:outline-none focus:ring-4 focus:ring-primary/20 focus:ring-offset-2",
                  "shadow-lg"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center mb-8",
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

                {/* Content */}
                <h3
                  className={cn(
                    "font-display text-3xl md:text-4xl font-bold mb-4",
                    "text-foreground group-hover:text-foreground"
                  )}
                >
                  {isRTL ? category.titleAr : category.titleFr}
                </h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 font-medium">
                  {isRTL ? category.descriptionAr : category.descriptionFr}
                </p>

                {/* CTA */}
                <div
                  className={cn(
                    "inline-flex items-center gap-3 font-semibold text-base",
                    category.accentColor,
                    "group-hover:gap-4 transition-all duration-300"
                  )}
                >
                  <span>{copy.explore}</span>
                  <ArrowRight
                    className={cn(
                      "w-5 h-5 transition-transform duration-300",
                      isRTL
                        ? "rotate-180 group-hover:-translate-x-1"
                        : "group-hover:translate-x-1"
                    )}
                  />
                </div>

                {/* Decorative Corner */}
                <div
                  className={cn(
                    "absolute -bottom-16 -right-16 w-40 h-40 rounded-full opacity-10",
                    category.accentColor === "text-primary"
                      ? "bg-primary"
                      : "bg-secondary",
                    "group-hover:opacity-25 group-hover:scale-125 transition-all duration-500"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
