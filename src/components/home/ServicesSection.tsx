import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wrench,
  Paintbrush,
  Zap,
  Droplets,
  ThermometerSun,
  Shield,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const topServices = [
  {
    icon: Wrench,
    slug: "plomberie",
    nameFr: "Plomberie",
    nameAr: "السباكة",
    descFr: "Installation et réparation",
    descAr: "تركيب وإصلاح",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Zap,
    slug: "electricite",
    nameFr: "Électricité",
    nameAr: "الكهرباء",
    descFr: "Travaux électriques",
    descAr: "أعمال كهربائية",
    color: "bg-yellow-500/10 text-yellow-600",
  },
  {
    icon: Paintbrush,
    slug: "peinture",
    nameFr: "Peinture",
    nameAr: "الدهان",
    descFr: "Peinture intérieure et extérieure",
    descAr: "دهان داخلي وخارجي",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    icon: ThermometerSun,
    slug: "climatisation",
    nameFr: "Climatisation",
    nameAr: "تكييف الهواء",
    descFr: "Installation et entretien",
    descAr: "تركيب وصيانة",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    icon: Droplets,
    slug: "nettoyage",
    nameFr: "Nettoyage",
    nameAr: "التنظيف",
    descFr: "Services de nettoyage professionnel",
    descAr: "خدمات التنظيف المهنية",
    color: "bg-green-500/10 text-green-600",
  },
  {
    icon: Shield,
    slug: "securite",
    nameFr: "Sécurité",
    nameAr: "الأمن",
    descFr: "Systèmes de sécurité",
    descAr: "أنظمة الأمان",
    color: "bg-red-500/10 text-red-600",
  },
];

export default function ServicesSection() {
  const { isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            {isRTL ? "خدمات احترافية لمنزلك" : "Services professionnels pour votre maison"}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isRTL
              ? "اكتشف أفضل الحرفيين والخدمات المنزلية في المغرب"
              : "Découvrez les meilleurs artisans et services pour votre maison au Maroc"}
          </p>
        </div>

        {/* Top 6 Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {topServices.map((service) => {
            const Icon = service.icon;
            return (
              <Link key={service.slug} to={`/services/${service.slug}`}>
                <Card className="group h-full hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-transparent hover:border-primary/20">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
                        service.color
                      )}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {isRTL ? service.nameAr : service.nameFr}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {isRTL ? service.descAr : service.descFr}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/services">
            <Button variant="default" size="lg" className="gap-2">
              {isRTL ? "عرض جميع الخدمات" : "Voir tous les services"}
              <Arrow className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/artisan/register">
            <Button variant="outline" size="lg" className="gap-2">
              {isRTL ? "سجل كحرفي" : "Inscrivez-vous comme artisan"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
