import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const { t, isRTL } = useLanguage();
  
  return (
    <footer className={`bg-foreground text-background/90 relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              135deg,
              transparent,
              transparent 10px,
              currentColor 10px,
              currentColor 11px
            )`,
          }}
        />
      </div>

      <div className="container relative z-10 pt-8 pb-16 md:pt-8 md:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="font-display text-xl font-semibold">
                TopAffaire<span className="text-primary">Immo</span>
              </span>
            </Link>
            <p className="text-sm text-background/60 leading-relaxed">
              {isRTL 
                ? 'شريكك الموثوق للعثور على العقار المثالي. اشترِ، بِع، أو استأجر بثقة.'
                : 'Votre partenaire de confiance pour trouver la propriété parfaite. Achetez, vendez ou louez en toute confiance.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-background">
              {isRTL ? 'روابط سريعة' : 'Liens rapides'}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/buy"
                  className="text-sm text-background/60 hover:text-primary transition-colors"
                >
                  {t('nav.buy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/rent"
                  className="text-sm text-background/60 hover:text-primary transition-colors"
                >
                  {t('nav.rent')}
                </Link>
              </li>
              <li>
                <Link
                  to="/add-listing"
                  className="text-sm text-background/60 hover:text-primary transition-colors"
                >
                  {t('nav.addListing')}
                </Link>
              </li>
              <li>
                <Link
                  to="/agencies"
                  className="text-sm text-background/60 hover:text-primary transition-colors"
                >
                  {t('nav.agencies')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-background">
              {isRTL ? 'قانوني' : 'Juridique'}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-background/60 hover:text-primary transition-colors"
                >
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-background/60 hover:text-primary transition-colors"
                >
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-background/60 hover:text-primary transition-colors"
                >
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-background/60 hover:text-primary transition-colors"
                >
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-background">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-background/60">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{isRTL ? 'الدار البيضاء، المغرب' : 'Casablanca, Maroc'}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-background/60">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>+212 5XX XX XX XX</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-background/60">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span>contact@topaffaireimmo.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/40">
            © {new Date().getFullYear()} TopAffaireImmo. {t('footer.rights')}.
          </p>
          <p className="text-sm text-background/40">
            {isRTL ? 'صُنع بعناية لباحثي العقارات' : 'Fait avec soin pour les chercheurs de propriétés'}
          </p>
        </div>
      </div>
    </footer>
  );
}
