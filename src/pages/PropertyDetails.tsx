import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdBanner from "@/components/home/AdBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Phone,
  MessageCircle,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock property data
const propertyData = {
  id: "1",
  title: "Luxury Penthouse with Ocean View",
  description: `This stunning penthouse offers panoramic views of the Atlantic Ocean and the Casablanca skyline. 
  
  Located in the prestigious Corniche district, this property features modern architecture with premium finishes throughout. The open-plan living area flows seamlessly onto a spacious terrace, perfect for entertaining or simply enjoying the coastal breeze.
  
  Key Features:
  • Floor-to-ceiling windows throughout
  • Italian marble flooring
  • State-of-the-art kitchen with premium appliances
  • Master suite with walk-in closet and spa bathroom
  • Private rooftop terrace with infinity pool
  • Two secure parking spaces
  • 24/7 concierge service`,
  price: 4500000,
  priceType: "sale" as "sale" | "rent",
  type: "Apartment",
  city: "Casablanca",
  address: "Corniche Ain Diab, Boulevard de la Corniche",
  bedrooms: 4,
  bathrooms: 3,
  area: 280,
  yearBuilt: 2022,
  featured: true,
  images: [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
  ],
  agent: {
    name: "Sarah El Mansouri",
    company: "Premium Real Estate",
    phone: "+212 6XX XX XX XX",
    type: "agency",
  },
};

export default function PropertyDetails() {
  const { id } = useParams();
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // In production, fetch property by id
  const property = propertyData;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-MA", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-20">
        {/* Image Gallery */}
        <section className="relative bg-foreground">
          <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
            <img
              src={property.images[currentImage]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Navigation Arrows */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Thumbnails */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {property.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={cn(
                    "w-16 h-12 rounded-lg overflow-hidden border-2 transition-all",
                    currentImage === index
                      ? "border-white scale-110"
                      : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <img
                    src={property.images[index]}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Image Counter */}
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm">
              {currentImage + 1} / {property.images.length}
            </div>
          </div>
        </section>

        {/* Property Content */}
        <section className="container py-8 md:py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {property.featured && (
                    <Badge className="bg-secondary text-secondary-foreground">
                      Featured
                    </Badge>
                  )}
                  <Badge variant="outline">{property.type}</Badge>
                  <Badge variant="outline">
                    {property.priceType === "sale" ? "For Sale" : "For Rent"}
                  </Badge>
                </div>

                <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
                  {property.title}
                </h1>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <p className="text-lg">
                    {property.address}, {property.city}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="bg-white rounded-xl border p-6">
                <p className="font-mono-price text-3xl md:text-4xl font-semibold text-primary">
                  {formatPrice(property.price)}{" "}
                  <span className="text-lg font-normal text-muted-foreground">
                    MAD
                  </span>
                  {property.priceType === "rent" && (
                    <span className="text-lg font-normal text-muted-foreground">
                      /month
                    </span>
                  )}
                </p>
              </div>

              {/* Features */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-display text-xl font-semibold mb-4">
                  Property Features
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {property.bedrooms && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Bed className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="font-semibold">{property.bedrooms}</p>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Bath className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="font-semibold">{property.bathrooms}</p>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                    </div>
                  )}
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Square className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="font-semibold">{property.area} m²</p>
                    <p className="text-sm text-muted-foreground">Living Area</p>
                  </div>
                  {property.yearBuilt && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="font-semibold">{property.yearBuilt}</p>
                      <p className="text-sm text-muted-foreground">Year Built</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-display text-xl font-semibold mb-4">
                  Description
                </h2>
                <div className="prose prose-neutral max-w-none">
                  {property.description.split("\n").map((paragraph, index) => (
                    <p key={index} className="text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5",
                      isFavorite && "fill-primary text-primary"
                    )}
                  />
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-xl border p-6 sticky top-24">
                <h3 className="font-display text-lg font-semibold mb-4">
                  Contact Agent
                </h3>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{property.agent.name}</p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {property.agent.company}
                    </div>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {property.agent.type === 'owner' ? 'Propriétaire' : 
                         property.agent.type === 'broker' ? 'Courtier' : 
                         'Agence'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full gap-2" size="lg">
                    <Phone className="h-5 w-5" />
                    Call Now
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-green-600 border-green-600 hover:bg-green-50"
                    size="lg"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Available 9AM - 7PM, Mon - Sat
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ad Banner before footer */}
        <AdBanner page="property" position="before_footer" className="bg-muted/30" />
      </main>

      <Footer />
    </div>
  );
}
