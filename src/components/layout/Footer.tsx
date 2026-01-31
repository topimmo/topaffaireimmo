import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Mail, Phone, MapPin, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Footer() {
  const { t, isRTL } = useLanguage();
  
  return (
    <footer className={`bg-foreground text-background/90 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container py-8 md:py-12">
        {/* Mobile: Accordion Layout */}
        <div className="md:hidden space-y-2">
          {/* Brand - Always visible on mobile */}
          <div className="mb-4">
            <Link to="/" className="flex items-center gap-2 mb-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-semibold">
                TopAffaire<span className="text-primary">Immo</span>
              </span>
            </Link>
            <p className="text-xs text-background/60 leading-relaxed">
              {isRTL 
                ? 'شريكك الموثوق للعثور على العقار المثالي'
                : 'Votre partenaire de confiance pour trouver la propriété parfaite'}
            </p>
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
                    <Phone className="h-3 w-3 text-primary flex-shrink-0" />
                    <span>+212 5XX XX XX XX</span>
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

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <Building2 className="h-7 w-7 text-primary" />
              <span className="font-display text-lg font-semibold">
                TopAffaire<span className="text-primary">Immo</span>
              </span>
            </Link>
            <p className="text-sm text-background/60 leading-relaxed">
              {isRTL 
                ? 'شريكك الموثوق للعثور على العقار المثالي. اشترِ، بِع، أو استأجر بثقة.'
                : 'Votre partenaire de confiance pour trouver la propriété parfaite.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 text-sm text-background">
              {isRTL ? 'روابط سريعة' : 'Liens rapides'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/buy" className="text-sm text-background/60 hover:text-primary transition-colors">
                  {t('nav.buy')}
                </Link>
              </li>
              <li>
                <Link to="/rent" className="text-sm text-background/60 hover:text-primary transition-colors">
                  {t('nav.rent')}
                </Link>
              </li>
              <li>
                <Link to="/add-listing" className="text-sm text-background/60 hover:text-primary transition-colors">
                  {t('nav.addListing')}
                </Link>
              </li>
              <li>
                <Link to="/agencies" className="text-sm text-background/60 hover:text-primary transition-colors">
                  {t('nav.agencies')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-3 text-sm text-background">
              {isRTL ? 'قانوني' : 'Juridique'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-background/60 hover:text-primary transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-background/60 hover:text-primary transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-background/60 hover:text-primary transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-background/60 hover:text-primary transition-colors">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3 text-sm text-background">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-background/60">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{isRTL ? 'الدار البيضاء، المغرب' : 'Casablanca, Maroc'}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-background/60">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>+212 5XX XX XX XX</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-background/60">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-xs lg:text-sm break-all">contact@topaffaireimmo.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom - Compact */}
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} TopAffaireImmo. {t('footer.rights')}.
          </p>
          <p className="text-xs text-background/40 hidden md:block">
            {isRTL ? 'صُنع بعناية' : 'Fait avec soin'}
          </p>
        </div>
      </div>
    </footer>
  );
}
