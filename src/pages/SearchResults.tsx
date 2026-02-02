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

// ✅ UI labels
const propertyTypes = ["Apartment", "House", "Villa", "Commercial", "Land"] as const;

// ✅ Helpers
const DEFAULT_PRICE_RANGE: [number, number] = [0, 10_000_000];

function normalize(v: string) {
  return (v || "").trim().toLowerCase();
}

// UI slug -> display label (مؤقتاً ثابتة)
const CITY_OPTIONS = [
  { value: "all-cities", label: "All Cities" },
  { value: "casablanca", label: "Casablanca" },
  { value: "rabat", label: "Rabat" },
  { value: "marrakech", label: "Marrakech" },
  { value: "fes", label: "Fes" },
  { value: "tangier", label: "Tangier" },
  { value: "agadir", label: "Agadir" },
] as const;

function getPublicImageUrl(pathOrUrl: string) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return supabase.storage.from("property-images").getPublicUrl(pathOrUrl).data.publicUrl;
}

export default function SearchResults() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();

  // ✅ derive initial values from URL (never empty)
  const urlType = useMemo(() => normalize(searchParams.get("type") || ""), [searchParams]);
  const urlCity = useMemo(() => normalize(searchParams.get("city") || ""), [searchParams]);

  const initialType = urlType ? urlType : "all-types";
  const initialCity = urlCity ? urlCity : "all-cities";

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>(DEFAULT_PRICE_RANGE);

  // ✅ IMPORTANT: Select value must NEVER be ""
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [sortBy, setSortBy] = useState<string>("newest");

  const [loading, setLoading] = useState(true);
  const [dbRows, setDbRows] = useState<DbProperty[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ keep state synced if URL changes (back/forward navigation)
  useEffect(() => {
    setSelectedType(initialType);
    setSelectedCity(initialCity);
  }, [initialType, initialCity]);

  // ✅ fetch from Supabase
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
          // Only show published properties on public search page
          .eq("status", "published");

        // ✅ Type filter (SQL) - نخففو فالfrontend filter final
        if (selectedType !== "all-types") {
          q = q.ilike("property_type", `%${selectedType}%`);
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

  // ✅ frontend filters (city + exact type + price)
  const filteredRows = useMemo(() => {
    let rows = [...dbRows];

    // City filter (UI slug vs DB name)
    if (selectedCity !== "all-cities") {
      rows = rows.filter((r) => {
        const dbCity =
          (language === "ar" ? r.city?.name_ar : r.city?.name_fr) || "";
        return normalize(dbCity) === normalize(selectedCity);
      });
    }

    // Exact type fallback
    if (selectedType !== "all-types") {
      rows = rows.filter((r) => normalize(r.property_type || "") === normalize(selectedType));
    }

    // Price range
    rows = rows.filter((r) => {
      const p = r.price ?? 0;
      return p >= priceRange[0] && p <= priceRange[1];
    });

    return rows;
  }, [dbRows, selectedCity, selectedType, priceRange, language]);

  // ✅ map to PropertyCard type
  const properties: Property[] = useMemo(() => {
    return filteredRows.map((r) => {
      const title =
        language === "ar"
          ? r.title_ar || r.title_fr || "Annonce"
          : r.title_fr || r.title_ar || "Annonce";

      const cityName =
        (language === "ar" ? r.city?.name_ar : r.city?.name_fr) || "";

      const firstImg = r.images?.[0] || "";
      const image = firstImg
        ? getPublicImageUrl(firstImg)
        : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

      return {
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
    });
  }, [filteredRows, language]);

  const clearFilters = () => {
    setSelectedType("all-types");
    setSelectedCity("all-cities");
    setPriceRange(DEFAULT_PRICE_RANGE);
  };

  const showClear =
    selectedCity !== "all-cities" ||
    selectedType !== "all-types" ||
    priceRange[0] > 0 ||
    priceRange[1] < DEFAULT_PRICE_RANGE[1];

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
            <p className="text-muted-foreground">{properties.length} properties found</p>
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
                {CITY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
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
                  <SelectItem key={type} value={normalize(type)}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* More Filters Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters((s) => !s)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              More Filters
            </Button>

            {showClear && (
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
                  viewMode === "grid" ? "bg-primary text-white" : "hover:bg-muted"
                )}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list" ? "bg-primary text-white" : "hover:bg-muted"
                )}
                aria-label="List view"
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
                onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                min={DEFAULT_PRICE_RANGE[0]}
                max={DEFAULT_PRICE_RANGE[1]}
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
          <div className="py-16 text-center text-muted-foreground">Loading properties...</div>
        ) : properties.length > 0 ? (
          <div
            className={cn(
              "grid gap-6",
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            )}
          >
            {properties.map((property, i) => (
              <div key={property.id}>
                <PropertyCard property={property} />

                {/* ✅ Ad inside results (Adsense friendly) */}
                {i === 5 && (
                  <AdBanner page="search" position="mid_results" className="mt-6" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No properties match your criteria.</p>
            <Button onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          </div>
        )}

        {/* Ad Banner (after results) */}
        <AdBanner page="search" position="after_results" className="mt-12" />
      </div>
    </div>
  );
}
