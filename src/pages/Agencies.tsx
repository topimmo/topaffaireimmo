import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Home,
  Loader2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agency {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  agency_name: string | null;
  agency_logo: string | null;
  agency_description_fr: string | null;
  agency_description_ar: string | null;
  agency_cities: string[] | null;
  listing_count: number;
}

export default function Agencies() {
  const { t, language, isRTL } = useLanguage();

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);

    // Fetch agencies with their listing counts
    const { data: agencyData, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, agency_name, agency_logo, agency_description_fr, agency_description_ar, agency_cities')
      .eq('user_type', 'agency');

    if (agencyData && !error) {
      // Get listing counts for each agency
      const agenciesWithCounts = await Promise.all(
        agencyData.map(async (agency) => {
          const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', agency.id)
            .eq('status', 'approved');

          return {
            ...agency,
            listing_count: count || 0,
          };
        })
      );

      setAgencies(agenciesWithCounts);
    }

    setLoading(false);
  };

  const getAgencyDescription = (agency: Agency) => {
    if (language === 'ar') return agency.agency_description_ar;
    return agency.agency_description_fr;
  };

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
              {t('nav.agencies')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL
                ? 'اكتشف الوكالات العقارية الموثوقة في المغرب. تصفح قوائمهم وتواصل معهم مباشرة.'
                : 'Découvrez les agences immobilières de confiance au Maroc. Parcourez leurs annonces et contactez-les directement.'}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          {/* No agencies */}
          {!loading && agencies.length === 0 && (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                {isRTL ? 'لا توجد وكالات مسجلة حتى الآن' : 'Aucune agence enregistrée pour le moment'}
              </h2>
              <p className="text-muted-foreground">
                {isRTL
                  ? 'كن أول وكالة تنضم إلى منصتنا!'
                  : 'Soyez la première agence à rejoindre notre plateforme!'}
              </p>
            </div>
          )}

          {/* Agencies Grid */}
          {!loading && agencies.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agencies.map((agency) => (
                <div
                  key={agency.id}
                  className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Agency Logo/Header */}
                  <div className="aspect-[3/1] bg-gradient-to-br from-primary/10 to-secondary/10 relative flex items-center justify-center">
                    {agency.agency_logo ? (
                      <img
                        src={agency.agency_logo}
                        alt={agency.agency_name || agency.full_name || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-16 w-16 text-primary/40" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      {agency.agency_name || agency.full_name || agency.email}
                    </h3>

                    {/* Description */}
                    {getAgencyDescription(agency) && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {getAgencyDescription(agency)}
                      </p>
                    )}

                    {/* Cities */}
                    {agency.agency_cities && agency.agency_cities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {agency.agency_cities.map((city, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {city}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        <strong className="text-foreground">{agency.listing_count}</strong>
                        {isRTL ? 'إعلان' : 'annonces'}
                      </span>
                    </div>

                    {/* Contact & View */}
                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link to={`/search?owner=${agency.id}`}>
                          {isRTL ? 'عرض الإعلانات' : 'Voir les annonces'}
                        </Link>
                      </Button>
                      {agency.phone && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={`tel:${agency.phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
