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
        "py-16 md:py-24 bg-gradient-to-b from-background to-muted/30",
        isRTL && "rtl"
      )}
    >
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
            {copy.headline}
          </h2>
          <p className="text-lg text-muted-foreground">{copy.subheadline}</p>
        </div>

        {/* Gateway Cards - Flexible Grid */}
        <div
          className={cn(
            "grid gap-6 md:gap-8 max-w-5xl mx-auto",
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
                  "group relative overflow-hidden rounded-2xl border border-border/50",
                  "bg-card hover:bg-gradient-to-br",
                  category.bgGradient,
                  "p-8 md:p-10 text-start transition-all duration-300",
                  "hover:shadow-xl hover:-translate-y-1 hover:border-border",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-6",
                    category.iconBg,
                    "group-hover:scale-110 transition-transform duration-300"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10",
                      category.accentColor
                    )}
                  />
                </div>

                {/* Content */}
                <h3
                  className={cn(
                    "font-display text-2xl md:text-3xl font-semibold mb-3",
                    "text-foreground group-hover:text-foreground"
                  )}
                >
                  {isRTL ? category.titleAr : category.titleFr}
                </h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
                  {isRTL ? category.descriptionAr : category.descriptionFr}
                </p>

                {/* CTA */}
                <div
                  className={cn(
                    "inline-flex items-center gap-2 font-medium",
                    category.accentColor,
                    "group-hover:gap-3 transition-all duration-300"
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
                    "absolute -bottom-12 -right-12 w-32 h-32 rounded-full opacity-10",
                    category.accentColor === "text-primary"
                      ? "bg-primary"
                      : "bg-secondary",
                    "group-hover:opacity-20 transition-opacity duration-300"
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
