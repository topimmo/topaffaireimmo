import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Building2, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  labelFr: string;
  labelAr: string;
  color: string;
}

const STATS: StatItem[] = [
  {
    icon: Users,
    value: 10000,
    suffix: "+",
    labelFr: "Utilisateurs actifs",
    labelAr: "مستخدم نشط",
    color: "text-blue-600",
  },
  {
    icon: Building2,
    value: 5000,
    suffix: "+",
    labelFr: "Annonces publiées",
    labelAr: "إعلان منشور",
    color: "text-primary",
  },
  {
    icon: Star,
    value: 98,
    suffix: "%",
    labelFr: "Taux de satisfaction",
    labelAr: "معدل الرضا",
    color: "text-amber-500",
  },
  {
    icon: TrendingUp,
    value: 15,
    suffix: "+",
    labelFr: "Villes couvertes",
    labelAr: "مدينة مغطاة",
    color: "text-green-600",
  },
];

function useCountUp(end: number, duration: number = 2000, isVisible: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(end * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, isVisible]);

  return count;
}

function AnimatedStat({ stat, index }: { stat: StatItem; index: number }) {
  const { isRTL } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = stat.icon;
  
  const count = useCountUp(stat.value, 2000, isVisible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const delayClasses = ['', 'delay-75', 'delay-150', 'delay-300'];
  const delayClass = delayClasses[index] || '';

  return (
    <div
      ref={ref}
      className={cn(
        "group relative flex flex-col items-center text-center p-6 md:p-8 rounded-2xl",
        "bg-card/50 backdrop-blur-sm border-2 border-border/30",
        "hover:border-primary/30 hover:shadow-xl hover:scale-[1.05]",
        "transition-all duration-500 ease-out",
        "animate-in fade-in slide-in-from-bottom-6 duration-700",
        delayClass
      )}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Icon */}
      <div className={cn(
        "relative mb-4 w-14 h-14 rounded-xl flex items-center justify-center",
        "bg-gradient-to-br from-background to-muted shadow-md",
        "group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
      )}>
        <Icon className={cn("w-7 h-7", stat.color)} />
      </div>

      {/* Count */}
      <div className="relative mb-2">
        <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          {count.toLocaleString()}
        </span>
        <span className="text-3xl md:text-4xl font-bold text-primary ml-1">
          {stat.suffix}
        </span>
      </div>

      {/* Label */}
      <p className="text-sm md:text-base text-muted-foreground font-medium">
        {isRTL ? stat.labelAr : stat.labelFr}
      </p>

      {/* Decorative shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-2xl" />
    </div>
  );
}

export default function SocialProofStrip() {
  const { isRTL } = useLanguage();

  return (
    <section className={cn("py-16 md:py-20 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30 relative overflow-hidden", isRTL ? "rtl" : "ltr")}>
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Star className="h-4 w-4 fill-current" />
            {isRTL ? "الثقة بالأرقام" : "Confiance en chiffres"}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {isRTL ? "انضم إلى آلاف المستخدمين الراضين" : "Rejoignez des milliers d'utilisateurs satisfaits"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isRTL
              ? "نحن نبني الثقة من خلال النتائج والخدمة الاستثنائية"
              : "Nous construisons la confiance à travers des résultats et un service exceptionnel"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((stat, index) => (
            <AnimatedStat key={index} stat={stat} index={index} />
          ))}
        </div>

        {/* Bottom accent line */}
        <div className="mt-12 flex justify-center">
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
        </div>
      </div>
    </section>
  );
}
