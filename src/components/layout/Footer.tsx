import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Footer() {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setSubscribed(false);
      }, 3000);
    }
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];
  
  return (
    <footer className={cn(
      "bg-gradient-to-b from-foreground to-foreground/95 text-background border-t border-background/10 relative overflow-hidden",
      isRTL ? 'rtl' : 'ltr'
    )}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 py-12 md:py-16">
        {/* Mobile: Accordion Layout */}
        <div className="md:hidden space-y-4">
          {/* Brand - Always visible on mobile */}
          <div className="mb-6">
            <Link to="/" className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display text-xl font-bold">
                TopAffaire<span className="text-primary">Immo</span>
              </span>
            </Link>
            <p className="text-sm text-background/70 leading-relaxed mb-4">
              {isRTL 
                ? 'شريكك الموثوق للعثور على العقار المثالي'
                : 'Votre partenaire de confiance pour trouver la propriété parfaite'}
            </p>
            
            {/* Social Links Mobile */}
            <div className="flex gap-3 mb-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-background/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {/* Quick Links */}
            <AccordionItem value="quick-links" className="border-background/10">
              <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                {isRTL ? 'روابط سريعة' : 'Liens rapides'}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="space-y-2">
                  <li>
                    <Link to="/buy" className="text-xs text-background/60 hover:text-primary transition-colors">
                      {t('nav.buy')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/rent" className="text-xs text-background/60 hover:text-primary transition-colors">
                      {t('nav.rent')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/add-listing" className="text-xs text-background/60 hover:text-primary transition-colors">
                      {t('nav.addListing')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/agencies" className="text-xs text-background/60 hover:text-primary transition-colors">
                      {t('nav.agencies')}
                    </Link>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Legal */}
            <AccordionItem value="legal" className="border-background/10">
              <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                {isRTL ? 'قانوني' : 'Juridique'}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="space-y-2">
                  <li>
                    <Link to="/about" className="text-xs text-background/60 hover:text-primary transition-colors">
                      {t('footer.about')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-xs text-background/60 hover:text-primary transition-colors">
                      {t('footer.privacy')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-xs text-background/60 hover:text-primary transition-colors">
                      {t('footer.terms')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-xs text-background/60 hover:text-primary transition-colors">
                      {t('footer.contact')}
                    </Link>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Contact */}
            <AccordionItem value="contact" className="border-background/10 border-b">
              <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                {t('footer.contact')}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-background/60">
                    <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                    <span>{isRTL ? 'الدار البيضاء، المغرب' : 'Casablanca, Maroc'}</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-background/60">
                    <Mail className="h-3 w-3 text-primary flex-shrink-0" />
                    <span>contact@topaffaireimmo.com</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Desktop: Premium Grid Layout */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Brand + Newsletter - Takes more space */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <span className="font-display text-2xl font-bold">
                TopAffaire<span className="text-primary">Immo</span>
              </span>
            </Link>
            <p className="text-sm text-background/70 leading-relaxed mb-6">
              {isRTL 
                ? 'شريكك الموثوق للعثور على العقار المثالي. اشترِ، بِع، أو استأجر بثقة.'
                : 'Votre partenaire de confiance pour trouver la propriété parfaite. Achetez, vendez ou louez en toute confiance.'}
            </p>
            
            {/* Newsletter Subscription */}
            <div className="space-y-3">
              <h4 className="font-bold text-base text-background">
                {isRTL ? 'اشترك في النشرة الإخبارية' : 'Newsletter'}
              </h4>
              <p className="text-xs text-background/60">
                {isRTL 
                  ? 'احصل على آخر العروض والأخبار'
                  : 'Recevez les dernières offres et actualités'}
              </p>
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <Input
                  type="email"
                  placeholder={isRTL ? 'بريدك الإلكتروني' : 'Votre email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/40 focus:bg-background/15 rounded-xl"
                  disabled={subscribed}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0"
                  disabled={subscribed}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {subscribed && (
                <p className="text-xs text-green-400 animate-in fade-in">
                  {isRTL ? '✓ تم الاشتراك بنجاح!' : '✓ Inscription réussie!'}
                </p>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-background/10">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-background/5 border-background/20 text-background/80 text-xs">
                  {isRTL ? '🔒 آمن ومشفر' : '🔒 Sécurisé & Crypté'}
                </Badge>
                <Badge variant="outline" className="bg-background/5 border-background/20 text-background/80 text-xs">
                  {isRTL ? '✓ معتمد' : '✓ Vérifié'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="font-bold mb-4 text-base text-background">
              {isRTL ? 'روابط سريعة' : 'Liens rapides'}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/buy" className="text-sm text-background/70 hover:text-primary transition-colors hover:translate-x-1 inline-block">
                  {t('nav.buy')}
                </Link>
              </li>
              <li>
                <Link to="/rent" className="text-sm text-background/70 hover:text-primary transition-colors hover:translate-x-1 inline-block">
                  {t('nav.rent')}
                </Link>
              </li>
              <li>
                <Link to="/add-listing" className="text-sm text-background/70 hover:text-primary transition-colors hover:translate-x-1 inline-block">
                  {t('nav.addListing')}
                </Link>
              </li>
              <li>
                <Link to="/agencies" className="text-sm text-background/70 hover:text-primary transition-colors hover:translate-x-1 inline-block">
                  {t('nav.agencies')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm text-background/70 hover:text-primary transition-colors hover:translate-x-1 inline-block">
                  {isRTL ? 'الخدمات' : 'Services'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2">
            <h4 className="font-bold mb-4 text-base text-background">
              {isRTL ? 'قانوني' : 'Juridique'}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/about" className="text-sm text-background/70 hover:text-primary transition-colors hover:translate-x-1 inline-block">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-background/70 hover:text-primary transition-colors hover:translate-x-1 inline-block">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-background/70 hover:text-primary transition-colors hover:translate-x-1 inline-block">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-background/70 hover:text-primary transition-colors hover:translate-x-1 inline-block">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact + Social */}
          <div className="lg:col-span-4">
            <h4 className="font-bold mb-4 text-base text-background">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-sm text-background/70">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span>{isRTL ? 'الدار البيضاء، المغرب' : 'Casablanca, Maroc'}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-background/70">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="break-all">contact@topaffaireimmo.com</span>
              </li>
            </ul>

            {/* Social Media */}
            <div>
              <h5 className="font-semibold mb-3 text-sm text-background/90">
                {isRTL ? 'تابعنا' : 'Suivez-nous'}
              </h5>
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-background/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6"
                      aria-label={social.label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Enhanced */}
        <div className="pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-background/50">
              © {new Date().getFullYear()} TopAffaireImmo. {t('footer.rights')}.
            </p>
            <div className="flex items-center gap-6 text-sm text-background/50">
              <span className="hidden md:inline">
                {isRTL ? 'صُنع بـ ❤️ في المغرب' : 'Fait avec ❤️ au Maroc'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

