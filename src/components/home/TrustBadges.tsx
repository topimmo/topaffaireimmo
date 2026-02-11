import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, CheckCircle, Users, Zap, Star, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TrustBadge {
  icon: React.ReactNode;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
}

const trustBadges: TrustBadge[] = [
  {
    icon: <CheckCircle className="h-7 w-7" />,
    titleFr: "Annonces Vérifiées",
    titleAr: "إعلانات موثقة",
    descriptionFr: "Toutes nos annonces sont vérifiées pour garantir leur authenticité",
    descriptionAr: "جميع إعلاناتنا موثقة لضمان صحتها",
  },
  {
    icon: <Shield className="h-7 w-7" />,
    titleFr: "Contact Sécurisé",
    titleAr: "تواصل آمن",
    descriptionFr: "Processus de contact sécurisé pour protéger vos informations",
    descriptionAr: "عملية تواصل آمنة لحماية معلوماتك",
  },
  {
    icon: <Zap className="h-7 w-7" />,
    titleFr: "Réponse Rapide",
    titleAr: "استجابة سريعة",
    descriptionFr: "Obtenez des réponses rapides de nos annonceurs vérifiés",
    descriptionAr: "احصل على ردود سريعة من معلنينا الموثقين",
  },
  {
    icon: <Users className="h-7 w-7" />,
    titleFr: "Des Milliers de Confiance",
    titleAr: "موثوق من الآلاف",
    descriptionFr: "Plus de 10 000 utilisateurs font confiance à notre plateforme",
    descriptionAr: "أكثر من 10,000 مستخدم يثقون بمنصتنا",
  },
];

export default function TrustBadges() {
  const { isRTL } = useLanguage();

  return (
    <section className={`py-20 md:py-24 bg-muted/30 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Star className="h-4 w-4" />
            {isRTL ? "موثوق ومضمون" : "Fiable & Vérifié"}
          </div>
          <h2 className="section-title mb-3">
            {isRTL ? "لماذا تختار TopAffaireImmo" : "Pourquoi Choisir TopAffaireImmo"}
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            {isRTL
              ? "نلتزم بتقديم أفضل تجربة في البحث عن العقارات"
              : "Nous nous engageons à offrir la meilleure expérience de recherche immobilière"}
          </p>
        </div>

        {/* Trust Badges Grid - 1 col mobile, 2 cols tablet, 4 cols desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustBadges.map((badge, index) => (
            <Card
              key={index}
              className="p-6 md:p-8 text-center hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl group"
            >
              {/* Icon */}
              <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                {badge.icon}
              </div>

              {/* Title */}
              <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                {isRTL ? badge.titleAr : badge.titleFr}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isRTL ? badge.descriptionAr : badge.descriptionFr}
              </p>
            </Card>
          ))}
        </div>

        {/* Bottom Stats Bar */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">10K+</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? "مستخدم نشط" : "Utilisateurs actifs"}
              </p>
            </div>
            <div className="hidden md:block w-px h-12 bg-border/50" />
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">5K+</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? "إعلان منشور" : "Annonces publiées"}
              </p>
            </div>
            <div className="hidden md:block w-px h-12 bg-border/50" />
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">15+</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? "مدينة مغطاة" : "Villes couvertes"}
              </p>
            </div>
            <div className="hidden md:block w-px h-12 bg-border/50" />
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">98%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? "رضا العملاء" : "Satisfaction client"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
