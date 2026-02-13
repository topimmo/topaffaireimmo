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

            {t('hero.subtitle')}
          </p>
        </div>

        {/* Search Form - Premium Glass Design */}
        <form
          onSubmit={handleSearch}

              }`}
            >
              {t('hero.forSale')}
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("rent")}

              }`}
            >
              {t('hero.forRent')}
            </button>
          </div>


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

                MAD
              </span>
              <Input
                type="number"
                placeholder={t('hero.maxPrice')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}

              />
            </div>

            {/* Search Button - Premium CTA */}
            <Button
              type="submit"
              size="lg"

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
