import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  User,
  Building2,
  FileText,
  MapPin,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "user" | "property" | "city" | "service";
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

interface AdminGlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminGlobalSearch({
  open,
  onOpenChange,
}: AdminGlobalSearchProps) {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    const searchResults: SearchResult[] = [];

    // Search users
    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, email, advertiser_type")
      .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .limit(5);

    if (users) {
      users.forEach((user) => {
        searchResults.push({
          type: "user",
          id: user.id,
          title: user.full_name || user.email || "Unknown User",
          subtitle: user.advertiser_type || "user",
          link: `/admin/users?id=${user.id}`,
        });
      });
    }

    // Search properties
    const { data: properties } = await supabase
      .from("properties")
      .select("id, title_fr, title_ar, status, property_type")
      .or(`title_fr.ilike.%${searchQuery}%,title_ar.ilike.%${searchQuery}%`)
      .limit(5);

    if (properties) {
      properties.forEach((property) => {
        searchResults.push({
          type: "property",
          id: property.id,
          title: isRTL ? property.title_ar : property.title_fr,
          subtitle: `${property.property_type} • ${property.status}`,
          link: `/admin/listings/${property.id}`,
        });
      });
    }

    // Search cities
    const { data: cities } = await supabase
      .from("cities")
      .select("id, name_fr, name_ar")
      .or(`name_fr.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%`)
      .limit(5);

    if (cities) {
      cities.forEach((city) => {
        searchResults.push({
          type: "city",
          id: city.id.toString(),
          title: isRTL ? city.name_ar : city.name_fr,
          subtitle: isRTL ? "مدينة" : "Ville",
          link: `/admin/locations?city=${city.id}`,
        });
      });
    }

    setResults(searchResults);
    setLoading(false);
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.link);
    onOpenChange(false);
    setQuery("");
  };

  const filteredResults =
    activeCategory === "all"
      ? results
      : results.filter((r) => r.type === activeCategory);

  const getIcon = (type: string) => {
    switch (type) {
      case "user":
        return User;
      case "property":
        return Building2;
      case "city":
        return MapPin;
      case "service":
        return FileText;
      default:
        return FileText;
    }
  };

  const categories = [
    { id: "all", labelFr: "Tout", labelAr: "الكل", count: results.length },
    {
      id: "user",
      labelFr: "Utilisateurs",
      labelAr: "المستخدمون",
      count: results.filter((r) => r.type === "user").length,
    },
    {
      id: "property",
      labelFr: "Annonces",
      labelAr: "الإعلانات",
      count: results.filter((r) => r.type === "property").length,
    },
    {
      id: "city",
      labelFr: "Villes",
      labelAr: "المدن",
      count: results.filter((r) => r.type === "city").length,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">
            {isRTL ? "البحث العام" : "Recherche globale"}
          </DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={
                isRTL
                  ? "ابحث عن مستخدمين، إعلانات، مدن..."
                  : "Rechercher utilisateurs, annonces, villes..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-lg h-12 border-0 focus-visible:ring-0"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </DialogHeader>

        {query.trim() && (
          <>
            {/* Category Filter */}
            <div className="flex gap-2 px-4 py-2 border-y bg-muted/30">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className="gap-1"
                >
                  {isRTL ? cat.labelAr : cat.labelFr}
                  <Badge variant="outline" className="ml-1 text-xs">
                    {cat.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Results */}
            <ScrollArea className="max-h-[400px]">
              {filteredResults.length > 0 ? (
                <div className="p-2">
                  {filteredResults.map((result) => {
                    const Icon = getIcon(result.type);
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        onClick={() => handleSelect(result)}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            result.type === "user" && "bg-purple-100",
                            result.type === "property" && "bg-blue-100",
                            result.type === "city" && "bg-green-100",
                            result.type === "service" && "bg-orange-100"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5",
                              result.type === "user" && "text-purple-600",
                              result.type === "property" && "text-blue-600",
                              result.type === "city" && "text-green-600",
                              result.type === "service" && "text-orange-600"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {isRTL ? "لا توجد نتائج" : "Aucun résultat trouvé"}
                  </p>
                </div>
              )}
            </ScrollArea>
          </>
        )}

        {!query.trim() && (
          <div className="p-8 text-center text-muted-foreground">
            <p>
              {isRTL
                ? "اكتب للبحث في المستخدمين والإعلانات والمدن"
                : "Tapez pour rechercher dans les utilisateurs, annonces et villes"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
