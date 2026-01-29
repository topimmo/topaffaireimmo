import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PropertyCard, { Property } from "@/components/home/PropertyCard";
import AdBanner from "@/components/home/AdBanner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, Grid3X3, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

// ✅ Supabase -> PropertyCard mapping
type DbProperty = {
  id: string;
  title_fr: string | null;
  title_ar: string | null;
  price: number | null;
  transaction_type: string | null; // sale / rent
  property_type: string | null; // Apartment / Villa ...
  status: string | null;
  created_at: string;
  images: string[] | null;
  city?: { name_fr: string | null; name_ar: string | null } | null;
  neighborhood?: { name_fr: string | null; name_ar: string | null } | null;
  address?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  featured?: boolean | null;
};

const propertyTypes = ["Apartment", "House", "Villa", "Commercial", "Land"];

export default function SearchResults() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000000]);

  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || "all-types"
  );
  const [selectedCity, setSelectedCity] = useState(
    searchParams.get("city") || "all-cities"
  );
  const [sortBy, setSortBy] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [dbRows, setDbRows] = useState<DbProperty[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ fetch from Supabase (approved only)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        let q = supabase
          .from("properties")
          .select(
            `
              id,
              title_fr,
              title_ar,
              price,
              transaction_type,
              property_type,
              status,
              created_at,
              images,
              address,
              bedrooms,
              bathrooms,
              area,
              featured,
              city:cities(name_fr, name_ar),
              neighborhood:neighborhoods(name_fr, name_ar)
            `
          )
          .eq("status", "approved");

        // City filter (slug/id?) — هنا كنقارن بالاسم باش تمشي دابا
        if (selectedCity !== "all-cities") {
          // If you store city_id in properties الأفضل نبدلوها لاحقا
          // دابا كنفلتر من بعد فالfrontend
        }

        // Type filter
        if (selectedType !== "all-types") {
          q = q.ilike("property_type", selectedType); // "apartment" etc
        }

        // Sorting
        if (sortBy === "newest") {
          q = q.order("created_at", { ascending: false });
        } else if (sortBy === "price-asc") {
          q = q.order("price", { ascending: true, nullsFirst: false });
        } else if (sortBy === "price-desc") {
          q = q.order("price", { ascending: false, nullsFirst: false });
        }

        const { data, error } = await q.limit(200);

        if (error) {
          setError(error.message);
          setDbRows([]);
        } else {
          setDbRows((data as DbProperty[]) || []);
        }
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
        setDbRows([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [selectedType, sortBy]);

  // ✅ Front filters (city + price)
  const filteredRows = useMemo(() => {
    let rows = [...dbRows];

    // city filter by name (temporary)
    if (selectedCity !== "all-cities") {
      rows = rows.filter((r) => {
        const cityName =
          (language === "ar" ? r.city?.name_ar : r.city?.name_fr) || "";
        return cityName.toLowerCase() === selectedCity.toLowerCase();
      });
    }

    // price range
    rows = rows.filter((r) => {
      const p = r.price ?? 0;
      return p >= priceRange[0] && p <= priceRange[1];
    });

    return rows;
  }, [dbRows, selectedCity, priceRange, language]);

  // ✅ convert to PropertyCard type
  const properties: Property[] = useMemo(() => {
    console.log('[SearchResults] Converting properties, count:', filteredRows.length);
    
    return filteredRows.map((r) => {
      const title =
        language === "ar"
          ? r.title_ar || r.title_fr || "Annonce"
          : r.title_fr || r.title_ar || "Annonce";

      const cityName =
        (language === "ar" ? r.city?.name_ar : r.city?.name_fr) || "";

      const firstImg = r.images?.[0] || "";
      const image = firstImg && firstImg.startsWith("http")
        ? firstImg
        : firstImg
        ? supabase.storage.from("property-images").getPublicUrl(firstImg).data.publicUrl
        : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

      const propertyCard = {
        id: r.id,
        title,
        price: r.price ?? 0,
        priceType: (r.transaction_type as any) || "sale",
        type: r.property_type || "Property",
        city: cityName || "—",
        address: r.address || (r.neighborhood?.name_fr ?? ""),
        bedrooms: r.bedrooms ?? undefined,
        bathrooms: r.bathrooms ?? undefined,
        area: r.area ?? undefined,
        image,
        featured: !!r.featured,
      };

      // ✅ Log first property mapping for debugging
      if (filteredRows.indexOf(r) === 0) {
        console.log('[SearchResults] First property mapped:', {
          dbId: r.id,
          cardId: propertyCard.id,
          title: propertyCard.title,
        });
      }

      return propertyCard;
    });
  }, [filteredRows, language]);

  const clearFilters = () => {
    setSelectedType("all-types");
    setSelectedCity("all-cities");
    setPriceRange([0, 10000000]);
  };

  return (
    <div className="pt-24 pb-16">
      <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
              Search Results
            </h1>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : error ? (
              <p className="text-red-600 text-sm">Error: {error}</p>
            ) : (
              <p className="text-muted-foreground">
                {properties.length} properties found
              </p>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex flex-wrap gap-4 flex-1">
              {/* City Filter */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-cities">All Cities</SelectItem>
                  {/* مؤقتاً: نخليها يدوي */}
                  <SelectItem value="casablanca">Casablanca</SelectItem>
                  <SelectItem value="rabat">Rabat</SelectItem>
                  <SelectItem value="marrakech">Marrakech</SelectItem>
                  <SelectItem value="fes">Fes</SelectItem>
                  <SelectItem value="tangier">Tangier</SelectItem>
                  <SelectItem value="agadir">Agadir</SelectItem>
                </SelectContent>
              </Select>

              {/* Property Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-types">All Types</SelectItem>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* More Filters Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                More Filters
              </Button>

              {(selectedCity !== "all-cities" ||
                selectedType !== "all-types" ||
                priceRange[0] > 0 ||
                priceRange[1] < 10000000) && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="flex gap-4 items-center">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="hidden md:flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "grid"
                      ? "bg-primary text-white"
                      : "hover:bg-muted"
                  )}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "list"
                      ? "bg-primary text-white"
                      : "hover:bg-muted"
                  )}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-white rounded-xl border p-6 mb-8">
              <h3 className="font-semibold mb-4">Price Range</h3>
              <div className="space-y-4">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={10000000}
                  step={100000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{priceRange[0].toLocaleString()} MAD</span>
                  <span>{priceRange[1].toLocaleString()} MAD</span>
                </div>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              Loading properties...
            </div>
          ) : properties.length > 0 ? (
            <div
              className={cn(
                "grid gap-6",
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              )}
            >
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No properties match your criteria.
              </p>
              <Button onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            </div>
          )}

          {/* Ad Banner */}
          <AdBanner page="search" position="after_results" className="mt-12" />
        </div>
    </div>
  );
}
