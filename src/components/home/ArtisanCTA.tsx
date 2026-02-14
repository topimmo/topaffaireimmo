import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { UserPlus, CheckCircle, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ArtisanCTA() {
  const { isRTL } = useLanguage();

  const benefits = [
    {
      icon: Users,
      titleFr: "Trouvez des clients près de chez vous",
      titleAr: "اعثر على عملاء بالقرب منك",
    },
    {
      icon: CheckCircle,
      titleFr: "Profil vérifié et crédible",
      titleAr: "ملف شخصي موثوق ومعتمد",
    },
    {
      icon: TrendingUp,
      titleFr: "Augmentez votre visibilité",
      titleAr: "زد من ظهورك",
    },
  ];

  return (
    <section className={cn(
      "py-20 md:py-24 relative overflow-hidden",
      isRTL ? "rtl" : "ltr"
    )}>
      {/* Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-secondary/10 to-transparent opacity-50" />

      <div className="container max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            
            <h2 className="section-title">
              {isRTL ? 'هل أنت حرفي محترف؟' : 'Vous êtes artisan ?'}
            </h2>
            
            <p className="section-subtitle text-lg">
              {isRTL 
                ? 'انضم إلى منصتنا واحصل على عملاء جدد كل يوم. سجل مجاناً وابدأ في تنمية عملك.'
                : 'Rejoignez la plateforme et trouvez des clients dès aujourd\'hui. Inscription gratuite et simple.'}
            </p>

            {/* Benefits List */}
            <div className="space-y-4 pt-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {isRTL ? benefit.titleAr : benefit.titleFr}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Button */}
            <div className="pt-6">
              <Link to="/register?type=artisan">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all rounded-xl hover:scale-[1.02] text-base font-semibold px-8"
                >
                  <UserPlus className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
                  {isRTL ? 'إنشاء ملفي المهني' : 'Créer mon profil'}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Visual Element / Stats */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-premium-lg hover-lift">
                  <div className="text-4xl font-bold text-primary mb-2">1000+</div>
                  <div className="text-sm text-muted-foreground">
                    {isRTL ? 'حرفيون نشطون' : 'Artisans actifs'}
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-premium-lg hover-lift mt-8">
                  <div className="text-4xl font-bold text-primary mb-2">5000+</div>
                  <div className="text-sm text-muted-foreground">
                    {isRTL ? 'مشاريع منجزة' : 'Projets réalisés'}
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-premium-lg hover-lift -mt-4">
                  <div className="text-4xl font-bold text-primary mb-2">4.8★</div>
                  <div className="text-sm text-muted-foreground">
                    {isRTL ? 'تقييم متوسط' : 'Note moyenne'}
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-premium-lg hover-lift mt-4">
                  <div className="text-4xl font-bold text-primary mb-2">24h</div>
                  <div className="text-sm text-muted-foreground">
                    {isRTL ? 'متوسط وقت الاستجابة' : 'Temps de réponse'}
                  </div>
                </div>
              </div>

              {/* Decorative Circle */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
