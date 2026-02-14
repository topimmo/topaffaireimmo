import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Home, 
  Wrench, 
  Filter, 
  FileQuestion,
  ArrowRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateType = 
  | "no-properties" 
  | "no-services" 
  | "no-search-results"
  | "no-favorites"
  | "no-listings"
  | "generic";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  message?: string;
  actionLabel?: string;
  actionLink?: string;
  onAction?: () => void;
  className?: string;
}

const EMPTY_STATE_CONFIG = {
  "no-properties": {
    icon: Home,
    titleFr: "Aucune propriété trouvée",
    titleAr: "لم يتم العثور على عقارات",
    messageFr: "Nous n'avons trouvé aucune propriété correspondant à vos critères. Essayez de modifier vos filtres ou explorez d'autres catégories.",
    messageAr: "لم نجد أي عقارات تطابق معاييرك. حاول تعديل الفلاتر أو استكشف فئات أخرى.",
    actionLabelFr: "Modifier les filtres",
    actionLabelAr: "تعديل الفلاتر",
    secondaryActionLabelFr: "Voir toutes les propriétés",
    secondaryActionLabelAr: "عرض جميع العقارات",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  "no-services": {
    icon: Wrench,
    titleFr: "Aucun artisan disponible",
    titleAr: "لا يوجد حرفيون متاحون",
    messageFr: "Aucun professionnel ne correspond à votre recherche pour le moment. Essayez une autre catégorie ou élargissez votre zone de recherche.",
    messageAr: "لا يوجد محترفون يطابقون بحثك في الوقت الحالي. جرب فئة أخرى أو وسع منطقة البحث.",
    actionLabelFr: "Explorer les catégories",
    actionLabelAr: "استكشف الفئات",
    secondaryActionLabelFr: "Voir tous les artisans",
    secondaryActionLabelAr: "عرض جميع الحرفيين",
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
  },
  "no-search-results": {
    icon: Search,
    titleFr: "Aucun résultat",
    titleAr: "لا توجد نتائج",
    messageFr: "Votre recherche n'a donné aucun résultat. Essayez avec d'autres mots-clés ou affinez vos critères de recherche.",
    messageAr: "لم يسفر بحثك عن أي نتائج. حاول استخدام كلمات مفتاحية أخرى أو قم بتحسين معايير البحث.",
    actionLabelFr: "Réinitialiser la recherche",
    actionLabelAr: "إعادة تعيين البحث",
    secondaryActionLabelFr: "Retour à l'accueil",
    secondaryActionLabelAr: "العودة إلى الصفحة الرئيسية",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-600/10",
  },
  "no-favorites": {
    icon: Home,
    titleFr: "Aucun favori",
    titleAr: "لا توجد مفضلات",
    messageFr: "Vous n'avez pas encore ajouté de propriétés à vos favoris. Commencez à explorer et enregistrez vos propriétés préférées.",
    messageAr: "لم تضف أي عقارات إلى المفضلة بعد. ابدأ في الاستكشاف واحفظ عقاراتك المفضلة.",
    actionLabelFr: "Explorer les propriétés",
    actionLabelAr: "استكشف العقارات",
    iconColor: "text-rose-600",
    iconBg: "bg-rose-600/10",
  },
  "no-listings": {
    icon: FileQuestion,
    titleFr: "Aucune annonce",
    titleAr: "لا توجد إعلانات",
    messageFr: "Vous n'avez pas encore publié d'annonces. Créez votre première annonce pour commencer à attirer des clients.",
    messageAr: "لم تنشر أي إعلانات بعد. أنشئ إعلانك الأول لبدء جذب العملاء.",
    actionLabelFr: "Créer une annonce",
    actionLabelAr: "إنشاء إعلان",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-600/10",
  },
  "generic": {
    icon: FileQuestion,
    titleFr: "Aucun élément",
    titleAr: "لا توجد عناصر",
    messageFr: "Aucun élément à afficher pour le moment.",
    messageAr: "لا توجد عناصر لعرضها في الوقت الحالي.",
    actionLabelFr: "Actualiser",
    actionLabelAr: "تحديث",
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted",
  },
};

export default function EmptyState({
  type,
  title,
  message,
  actionLabel,
  actionLink,
  onAction,
  className,
}: EmptyStateProps) {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;

  const displayTitle = title || (isRTL ? config.titleAr : config.titleFr);
  const displayMessage = message || (isRTL ? config.messageAr : config.messageFr);
  const displayActionLabel = actionLabel || (isRTL ? config.actionLabelAr : config.actionLabelFr);

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionLink) {
      navigate(actionLink);
    }
  };

  const handleSecondaryAction = () => {
    if (type === "no-properties") {
      navigate('/search');
    } else if (type === "no-services") {
      navigate('/services');
    } else if (type === "no-search-results") {
      navigate('/');
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 md:py-24 px-6", className)}>
      <div className="max-w-md text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={cn(
            "w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center",
            config.iconBg,
            "shadow-lg animate-in zoom-in duration-700 delay-150"
          )}>
            <Icon className={cn("w-12 h-12 md:w-14 md:h-14", config.iconColor)} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl md:text-3xl font-bold text-foreground">
          {displayTitle}
        </h3>

        {/* Message */}
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          {displayMessage}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
          {(onAction || actionLink) && (
            <Button
              onClick={handleAction}
              size="lg"
              className="rounded-xl gap-2 hover:scale-[1.02] transition-transform"
            >
              <Filter className="h-4 w-4" />
              {displayActionLabel}
            </Button>
          )}
          
          {(type === "no-properties" || type === "no-services" || type === "no-search-results") && (
            <Button
              onClick={handleSecondaryAction}
              variant="outline"
              size="lg"
              className="rounded-xl gap-2 hover:scale-[1.02] transition-transform"
            >
              {isRTL 
                ? (config as any).secondaryActionLabelAr 
                : (config as any).secondaryActionLabelFr}
              <ArrowRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
            </Button>
          )}
        </div>

        {/* Decorative element */}
        <div className="pt-8 flex justify-center">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse delay-75" />
            <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse delay-150" />
          </div>
        </div>
      </div>
    </div>
  );
}
