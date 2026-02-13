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
            return (
              <button
                key={category.id}
                onClick={() => navigate(category.link)}
                className={cn(

                )}
              >
                {/* Icon - Larger & more prominent */}
                <div
                  className={cn(

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

                    "text-foreground group-hover:text-foreground"
                  )}
                >
                  {isRTL ? category.titleAr : category.titleFr}
                </h3>

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
