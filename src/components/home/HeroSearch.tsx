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
    <section className={`relative min-h-[70vh] md:min-h-[75vh] flex items-center justify-center overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
          alt="Beautiful modern home"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/75 via-charcoal/55 to-charcoal/85" />
      </div>

      {/* Content */}
      <div className="container relative z-10 pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="max-w-3xl mx-auto text-center mb-8 md:mb-12">
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 drop-shadow-lg">
            {t('hero.title')}{" "}
            <span className="text-primary drop-shadow-md">{t('hero.titleHighlight')}</span>
          </h1>
          <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 font-medium drop-shadow-md">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 border-2 border-white/50"
        >
          {/* Transaction Type Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setTransactionType("sale")}
              className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                transactionType === "sale"
                  ? "bg-primary text-white shadow-lg scale-105"
                  : "bg-muted/50 text-foreground/70 hover:bg-muted hover:scale-102 shadow-sm"
              }`}
            >
              {t('hero.forSale')}
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("rent")}
              className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                transactionType === "rent"
                  ? "bg-primary text-white shadow-lg scale-105"
                  : "bg-muted/50 text-foreground/70 hover:bg-muted hover:scale-102 shadow-sm"
              }`}
            >
              {t('hero.forRent')}
            </button>
          </div>

          {/* Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* City */}
            <div className="relative">
              <MapPin className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10`} />
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 bg-background border-2 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm hover:shadow-md hover:border-primary/40`}>
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
              <Home className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10`} />
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 bg-background border-2 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm hover:shadow-md hover:border-primary/40`}>
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
              <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-muted-foreground font-mono-price text-sm font-semibold`}>
                MAD
              </span>
              <Input
                type="number"
                placeholder={t('hero.maxPrice')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className={`${isRTL ? 'pr-12' : 'pl-12'} h-12 bg-background border-2 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm hover:shadow-md hover:border-primary/40`}
              />
            </div>

            {/* Search Button */}
            <Button
              type="submit"
              size="lg"
              className="h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0"
            >
              <Search className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('hero.search')}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
