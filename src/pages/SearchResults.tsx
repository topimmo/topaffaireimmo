import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard, { Property } from "@/components/home/PropertyCard";
import AdBanner from "@/components/home/AdBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Mock data - in production this would come from an API
const allProperties: Property[] = [
  {
    id: "1",
    title: "Luxury Penthouse with Ocean View",
    price: 4500000,
    priceType: "sale",
    type: "Apartment",
    city: "Casablanca",
    address: "Corniche Ain Diab",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    featured: true,
  },
  {
    id: "2",
    title: "Modern Villa in Prestigious Neighborhood",
    price: 8200000,
    priceType: "sale",
    type: "Villa",
    city: "Marrakech",
    address: "Amelkis Golf Resort",
    bedrooms: 5,
    bathrooms: 4,
    area: 450,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  },
  {
    id: "3",
    title: "Contemporary Apartment in City Center",
    price: 2800000,
    priceType: "sale",
    type: "Apartment",
    city: "Rabat",
    address: "Agdal District",
    bedrooms: 3,
    bathrooms: 2,
    area: 165,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  },
  {
    id: "4",
    title: "Beachfront House with Private Pool",
    price: 6500000,
    priceType: "sale",
    type: "House",
    city: "Tangier",
    address: "Cap Spartel",
    bedrooms: 4,
    bathrooms: 3,
    area: 320,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  },
  {
    id: "5",
    title: "Spacious Family Apartment",
    price: 1850000,
    priceType: "sale",
    type: "Apartment",
    city: "Casablanca",
    address: "Maarif District",
    bedrooms: 3,
    bathrooms: 2,
    area: 145,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    id: "6",
    title: "Modern Studio for Rent",
    price: 6500,
    priceType: "rent",
    type: "Apartment",
    city: "Rabat",
    address: "Hassan District",
    bedrooms: 1,
    bathrooms: 1,
    area: 55,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  },
  {
    id: "7",
    title: "Commercial Space in Prime Location",
    price: 25000,
    priceType: "rent",
    type: "Commercial",
    city: "Casablanca",
    address: "Boulevard Zerktouni",
    area: 200,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  },
  {
    id: "8",
    title: "Traditional Riad with Modern Amenities",
    price: 3200000,
    priceType: "sale",
    type: "House",
    city: "Marrakech",
    address: "Medina",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  },
];

const propertyTypes = ["Apartment", "House", "Villa", "Commercial", "Land"];
const cities = ["Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir"];

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all-types");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "all-cities");
  const [sortBy, setSortBy] = useState("newest");

  const filteredProperties = allProperties.filter((property) => {
    if (selectedType !== "all-types" && property.type.toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }
    if (selectedCity !== "all-cities" && property.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    if (property.price < priceRange[0] || property.price > priceRange[1]) {
      return false;
    }
    return true;
  });

  const clearFilters = () => {
    setSelectedType("all-types");
    setSelectedCity("all-cities");
    setPriceRange([0, 10000000]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
              Search Results
            </h1>
            <p className="text-muted-foreground">
              {filteredProperties.length} properties found
            </p>
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
                  {cities.map((city) => (
                    <SelectItem key={city} value={city.toLowerCase()}>
                      {city}
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

              {(selectedCity !== "all-cities" || selectedType !== "all-types" || priceRange[0] > 0 || priceRange[1] < 10000000) && (
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
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "list" ? "bg-primary text-white" : "hover:bg-muted"
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
          <div
            className={cn(
              "grid gap-6",
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            )}
          >
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {filteredProperties.length === 0 && (
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
      </main>

      <Footer />
    </div>
  );
}
