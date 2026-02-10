import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Building2,
  ArrowRight,
  ArrowLeft,
  Users,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CTABanners() {
  const { isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-16">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Artisan CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 p-8 lg:p-10 text-white">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-6 backdrop-blur-sm">
                <Wrench className="w-8 h-8" />
              </div>
              
              <h3 className="font-display text-2xl lg:text-3xl font-semibold mb-4">
                {isRTL ? "أنت حرفي؟" : "Vous êtes artisan ?"}
              </h3>
              
              <p className="text-white/80 mb-6 max-w-sm">
                {isRTL
                  ? "انضم إلى شبكتنا من الحرفيين المحترفين واحصل على عملاء جدد في منطقتك"
                  : "Rejoignez notre réseau d'artisans professionnels et obtenez de nouveaux clients dans votre zone"}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{isRTL ? "+5000 حرفي" : "+5000 artisans"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{isRTL ? "كل المغرب" : "Tout le Maroc"}</span>
                </div>
              </div>
              
              <Link to="/artisan/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-secondary hover:bg-white/90 gap-2"
                >
                  {isRTL ? "سجل الآن" : "Inscrivez-vous"}
                  <Arrow className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Real Estate Advertiser CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 lg:p-10 text-white">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-6 backdrop-blur-sm">
                <Building2 className="w-8 h-8" />
              </div>
              
              <h3 className="font-display text-2xl lg:text-3xl font-semibold mb-4">
                {isRTL ? "أنت معلن عقاري؟" : "Vous êtes annonceur immobilier ?"}
              </h3>
              
              <p className="text-white/80 mb-6 max-w-sm">
                {isRTL
                  ? "أضف عقاراتك وتواصل مع آلاف المشترين والمستأجرين المحتملين"
                  : "Publiez vos biens et connectez-vous avec des milliers d'acheteurs et locataires potentiels"}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>{isRTL ? "+10K زيارة/يوم" : "+10K visites/jour"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>{isRTL ? "+2000 عقار" : "+2000 biens"}</span>
                </div>
              </div>
              
              <Link to="/add-listing">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 gap-2"
                >
                  {isRTL ? "أضف إعلانك" : "Publier une annonce"}
                  <Arrow className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
