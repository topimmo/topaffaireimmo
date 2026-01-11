import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, Building2, ArrowRight } from "lucide-react";

export default function CTASection() {
  const { t, isRTL } = useLanguage();
  
  return (
    <section className={`py-16 md:py-24 bg-background noise-texture ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Add Listing CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-primary p-8 md:p-10 text-white">
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 mb-6">
                <Plus className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-semibold mb-3">
                {isRTL ? 'أضف عقارك' : 'Publiez votre bien'}
              </h3>
              <p className="text-white/80 mb-6 max-w-sm">
                {isRTL 
                  ? 'تواصل مع آلاف المشترين والمستأجرين المحتملين. انشر إعلانك مجاناً واحصل على مزيد من الرؤية.'
                  : 'Atteignez des milliers d\'acheteurs et locataires potentiels. Publiez votre annonce gratuitement.'}
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link to="/add-listing">
                  {t('nav.addListing')}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Link>
              </Button>
            </div>
            {/* Decorative circles */}
            <div className={`absolute top-0 ${isRTL ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} w-64 h-64 bg-white/10 rounded-full -translate-y-1/2`} />
            <div className={`absolute bottom-0 ${isRTL ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'} w-40 h-40 bg-white/5 rounded-full translate-y-1/2`} />
          </div>

          {/* Agency CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-secondary p-8 md:p-10 text-white">
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 mb-6">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-semibold mb-3">
                {isRTL ? 'للوكالات العقارية' : 'Pour les agences immobilières'}
              </h3>
              <p className="text-white/80 mb-6 max-w-sm">
                {isRTL 
                  ? 'انضم إلى شبكتنا من الوكالات الموثوقة. احصل على ميزات متميزة وتحليلات وأدوات لتنمية عملك.'
                  : 'Rejoignez notre réseau d\'agences de confiance. Obtenez des fonctionnalités premium et des outils pour développer votre activité.'}
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-secondary hover:bg-white/90"
              >
                <Link to="/register">
                  {isRTL ? 'سجل الآن' : 'Inscrivez-vous'}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Link>
              </Button>
            </div>
            {/* Decorative circles */}
            <div className={`absolute top-0 ${isRTL ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} w-64 h-64 bg-white/10 rounded-full -translate-y-1/2`} />
            <div className={`absolute bottom-0 ${isRTL ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'} w-40 h-40 bg-white/5 rounded-full translate-y-1/2`} />
          </div>
        </div>
      </div>
    </section>
  );
}
