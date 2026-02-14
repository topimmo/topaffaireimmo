import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, Target, Shield, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ValueCard {
  icon: React.ElementType;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  color: string;
}

const VALUES: ValueCard[] = [
  {
    icon: Heart,
    titleFr: "Passion",
    titleAr: "الشغف",
    descriptionFr: "Nous aimons connecter les gens avec leurs rêves immobiliers",
    descriptionAr: "نحب ربط الناس بأحلامهم العقارية",
    color: "text-rose-500",
  },
  {
    icon: Target,
    titleFr: "Mission",
    titleAr: "المهمة",
    descriptionFr: "Simplifier l'immobilier et rendre chaque transaction transparente",
    descriptionAr: "تبسيط العقارات وجعل كل معاملة شفافة",
    color: "text-primary",
  },
  {
    icon: Shield,
    titleFr: "Confiance",
    titleAr: "الثقة",
    descriptionFr: "Vérification rigoureuse pour protéger nos utilisateurs",
    descriptionAr: "التحقق الصارم لحماية مستخدمينا",
    color: "text-green-600",
  },
  {
    icon: TrendingUp,
    titleFr: "Innovation",
    titleAr: "الابتكار",
    descriptionFr: "Technologie moderne au service de l'immobilier marocain",
    descriptionAr: "التكنولوجيا الحديثة في خدمة العقارات المغربية",
    color: "text-blue-600",
  },
];

export default function StorytellingSection() {
  const { isRTL } = useLanguage();

  return (
    <section className={cn("py-20 md:py-28 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden", isRTL ? "rtl" : "ltr")}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-7xl mx-auto relative z-10">
        {/* Main Story */}
        <div className="text-center max-w-4xl mx-auto mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Heart className="h-4 w-4" />
            {isRTL ? "قصتنا" : "Notre Histoire"}
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            {isRTL 
              ? "نبني الثقة، منزلاً واحداً في كل مرة"
              : "Construire la confiance, une maison à la fois"}
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {isRTL
              ? "في TopAffaireImmo، نؤمن بأن العثور على المنزل المثالي أو الحرفي الموثوق يجب أن يكون بسيطاً وشفافاً وجديراً بالثقة. نحن لا نربط فقط بين المشترين والبائعين - بل نبني مجتمعاً مبنياً على الثقة والجودة والخدمة الاستثنائية."
              : "Chez TopAffaireImmo, nous croyons que trouver la maison parfaite ou l'artisan de confiance doit être simple, transparent et fiable. Nous ne connectons pas seulement acheteurs et vendeurs - nous construisons une communauté basée sur la confiance, la qualité et le service exceptionnel."}
          </p>

          <div className="pt-4">
            <div className="inline-flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>{isRTL ? "تأسست في 2024" : "Fondée en 2024"}</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse delay-75" />
                <span>{isRTL ? "تخدم المغرب بأكمله" : "Servant tout le Maroc"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {VALUES.map((value, index) => {
            const Icon = value.icon;
            const delayClasses = ['', 'delay-75', 'delay-150', 'delay-300'];
            const delayClass = delayClasses[index] || '';
            
            return (
              <Card
                key={index}
                className={cn(
                  "group relative p-6 md:p-8 text-center border-2 border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl",
                  "hover:border-primary/30 hover:shadow-xl hover:scale-[1.02]",
                  "transition-all duration-500 ease-out",
                  "animate-in fade-in slide-in-from-bottom-8 duration-700",
                  delayClass
                )}
              >
                {/* Icon with gradient background */}
                <div className="relative mb-6 inline-flex">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <div className={cn(
                    "relative w-16 h-16 rounded-2xl flex items-center justify-center",
                    "bg-gradient-to-br from-background to-muted",
                    "group-hover:scale-110 group-hover:rotate-3 transition-all duration-500",
                    "shadow-lg"
                  )}>
                    <Icon className={cn("w-8 h-8", value.color)} />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                  {isRTL ? value.titleAr : value.titleFr}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isRTL ? value.descriptionAr : value.descriptionFr}
                </p>

                {/* Decorative line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            );
          })}
        </div>

        {/* Vision Statement */}
        <div className="mt-16 text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <blockquote className="relative">
            <div className="absolute -top-4 -left-4 text-6xl text-primary/10 font-serif">"</div>
            <p className="text-xl md:text-2xl font-medium text-foreground/90 leading-relaxed italic relative z-10 px-8">
              {isRTL
                ? "رؤيتنا هي أن نصبح المنصة الأكثر ثقة في المغرب، حيث تبدأ كل رحلة عقارية وحيث يجد كل حرفي عملاء يقدرون الحرفية الجيدة."
                : "Notre vision est de devenir la plateforme la plus fiable du Maroc, où chaque voyage immobilier commence et où chaque artisan trouve des clients qui apprécient la qualité."}
            </p>
            <div className="absolute -bottom-4 -right-4 text-6xl text-primary/10 font-serif">"</div>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
