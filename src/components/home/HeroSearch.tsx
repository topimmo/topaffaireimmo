import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Home, Building, Landmark, Trees } from "lucide-react";

interface City {
  id: number;
  name_fr: string;
  name_ar: string;
  is_active?: boolean;
}

const propertyTypes = [
  { value: "apartment", icon: Building },
  { value: "house", icon: Home },
  { value: "villa", icon: Landmark },
  { value: "commercial", icon: Building },
  { value: "land", icon: Trees },
];

export default function HeroSearch() {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [transactionType, setTransactionType] = useState("sale");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const fetchCities = async () => {
      // Use fallback cities if Supabase is not configured
      if (!isSupabaseConfigured) {
        setCities([
          { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
          { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
          { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
          { id: 4, name_fr: 'Tanger', name_ar: 'طنجة' },
          { id: 5, name_fr: 'Fès', name_ar: 'فاس' },
          { id: 6, name_fr: 'Agadir', name_ar: 'أكادير' },
          { id: 7, name_fr: 'Meknès', name_ar: 'مكناس' },
          { id: 8, name_fr: 'Oujda', name_ar: 'وجدة' },
          { id: 9, name_fr: 'Kénitra', name_ar: 'القنيطرة' },
          { id: 10, name_fr: 'Tétouan', name_ar: 'تطوان' },
          { id: 11, name_fr: 'El Jadida', name_ar: 'الجديدة' },
          { id: 12, name_fr: 'Safi', name_ar: 'آسفي' },
          { id: 13, name_fr: 'Mohammedia', name_ar: 'المحمدية' },
          { id: 14, name_fr: 'Laâyoune', name_ar: 'العيون' },
          { id: 15, name_fr: 'Dakhla', name_ar: 'الداخلة' },
        ]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('cities')
          .select('id, name_fr, name_ar, is_active')
          .eq('is_active', true)
          .order('display_order');
        
        if (error) {
          console.error('Error fetching cities:', error);
          // Use fallback cities on error
          setCities([
            { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
            { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
            { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
            { id: 4, name_fr: 'Tanger', name_ar: 'طنجة' },
            { id: 5, name_fr: 'Fès', name_ar: 'فاس' },
            { id: 6, name_fr: 'Agadir', name_ar: 'أكادير' },
          ]);
          return;
        }
        
        if (data && data.length > 0) {
          setCities(data);
        } else {
          // Fallback if no cities returned
          setCities([
            { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
            { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
            { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
          ]);
        }
      } catch (err) {
        console.error('Exception fetching cities:', err);
        // Use fallback cities on exception
        setCities([
          { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
          { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
          { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
        ]);
      }
    };
    fetchCities();
  }, []);

  const getCityName = (c: City) => {
    if (language === 'ar') return c.name_ar;
    return c.name_fr;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (propertyType) params.set("type", propertyType);
    if (transactionType) params.set("transaction", transactionType);
    if (maxPrice) params.set("maxPrice", maxPrice);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className={`relative min-h-[65vh] md:min-h-[70vh] max-h-[75vh] flex items-center justify-center overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Background Image with Premium Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85"
          alt="Beautiful modern home"
          className="w-full h-full object-cover scale-105 transition-transform duration-[20s] hover:scale-100"
        />
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        {/* Hero Title - Premium Typography */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="hero-title text-white mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {t('hero.title')}{' '}
            <span className="text-primary relative">
              {t('hero.titleHighlight')}
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/40 rounded-full" />
            </span>
          </h1>
          <p className="hero-subtitle mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Search Form - Premium Glass Design with Glassmorphism */}
        <form
          onSubmit={handleSearch}
          className="bg-white/95 backdrop-blur-2xl rounded-2xl p-6 md:p-10 shadow-premium-xl max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 border border-white/60 ring-1 ring-black/5"
        >
          {/* Transaction Type Tabs - Premium Styling */}
          <div className="flex gap-3 mb-6 md:mb-8">
            <button
              type="button"
              onClick={() => setTransactionType("sale")}
              className={`flex-1 px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                transactionType === "sale"
                  ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30 scale-[1.02]"
                  : "bg-muted/80 text-foreground/70 hover:bg-muted hover:shadow-sm"
              }`}
            >
              {t('hero.forSale')}
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("rent")}
              className={`flex-1 px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                transactionType === "rent"
                  ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30 scale-[1.02]"
                  : "bg-muted/80 text-foreground/70 hover:bg-muted hover:shadow-sm"
              }`}
            >
              {t('hero.forRent')}
            </button>
          </div>

          {/* Search Fields - Premium Inputs with improved spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {/* City */}
            <div className="relative">
              <MapPin className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10`} />
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className={`${isRTL ? 'pr-11' : 'pl-11'} h-12 md:h-14 bg-background/80 border-2 border-border/50 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl transition-all shadow-sm hover:shadow-md hover:border-border`}>
                  <SelectValue placeholder={t('hero.selectCity')} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {getCityName(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Property Type */}
            <div className="relative">
              <Home className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10`} />
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className={`${isRTL ? 'pr-11' : 'pl-11'} h-12 md:h-14 bg-background/80 border-2 border-border/50 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl transition-all shadow-sm hover:shadow-md hover:border-border`}>
                  <SelectValue placeholder={t('hero.propertyType')} />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {t(`property.${type.value}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max Price */}
            <div className="relative">
              <span className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground font-mono-price text-xs font-medium`}>
                MAD
              </span>
              <Input
                type="number"
                placeholder={t('hero.maxPrice')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className={`${isRTL ? 'pr-12' : 'pl-12'} h-12 md:h-14 bg-background/80 border-2 border-border/50 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl transition-all shadow-sm hover:shadow-md hover:border-border`}
              />
            </div>

            {/* Search Button - Premium CTA - Full width on mobile */}
            <Button
              type="submit"
              size="lg"
              className="h-12 md:h-14 w-full text-base font-semibold bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all rounded-xl hover:scale-[1.02]"
            >
              <Search className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('hero.search')}
            </Button>
          </div>
        </form>
      </div>

      {/* Spacer for section separation */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
