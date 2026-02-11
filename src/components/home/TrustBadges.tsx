import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, CheckCircle, Users, HeadphonesIcon } from "lucide-react";
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
    icon: <Shield className="h-8 w-8" />,
    titleFr: "Annonces Vérifiées",
    titleAr: "إعلانات موثقة",
    descriptionFr: "Toutes nos annonces sont vérifiées pour garantir leur authenticité",
    descriptionAr: "جميع إعلاناتنا موثقة لضمان صحتها",
  },
  {
    icon: <CheckCircle className="h-8 w-8" />,
    titleFr: "Transactions Sécurisées",
    titleAr: "معاملات آمنة",
    descriptionFr: "Plateforme sécurisée pour des transactions en toute confiance",
    descriptionAr: "منصة آمنة لمعاملات موثوقة",
  },
  {
    icon: <Users className="h-8 w-8" />,
    titleFr: "Communauté Active",
    titleAr: "مجتمع نشط",
    descriptionFr: "Plus de 10 000 utilisateurs font confiance à notre plateforme",
    descriptionAr: "أكثر من 10,000 مستخدم يثقون بمنصتنا",
  },
  {
    icon: <HeadphonesIcon className="h-8 w-8" />,
    titleFr: "Support 24/7",
    titleAr: "دعم 24/7",
    descriptionFr: "Notre équipe est disponible pour vous accompagner à tout moment",
    descriptionAr: "فريقنا متاح لمساعدتك في أي وقت",
  },
];

export default function TrustBadges() {
  const { isRTL } = useLanguage();

  return (
    <section className={`py-20 md:py-24 bg-background ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="section-title mb-3">
            {isRTL ? "لماذا تختار TopAffaireImmo" : "Pourquoi TopAffaireImmo"}
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            {isRTL
              ? "نلتزم بتقديم أفضل تجربة في البحث عن العقارات"
              : "Nous nous engageons à offrir la meilleure expérience de recherche immobilière"}
          </p>
        </div>

        {/* Trust Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustBadges.map((badge, index) => (
            <Card
              key={index}
              className="p-6 md:p-8 text-center hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card/50 backdrop-blur-sm"
            >
              {/* Icon */}
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                {badge.icon}
              </div>

              {/* Title */}
              <h3 className="font-display text-lg md:text-xl font-bold mb-2">
                {isRTL ? badge.titleAr : badge.titleFr}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isRTL ? badge.descriptionAr : badge.descriptionFr}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
