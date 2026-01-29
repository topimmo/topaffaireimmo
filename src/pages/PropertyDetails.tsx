import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AdBanner from "@/components/home/AdBanner";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
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
import { MOROCCO_CITIES, slugify } from "@/lib/seo";
import { supabase } from "@/lib/supabase";

export default function PropertyDetails() {
  const { id } = useParams();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchProperty = async () => {
      if (!id) return;

      // ✅ Debug log (for navigation issue diagnosis - Issue #5 verification)
      console.log("[PropertyDetails] Loading property with ID:", id);

      setLoading(true);

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.log("[PropertyDetails] fetch error:", error);
        setProperty(null);
      } else {
        // ✅ Debug log (for navigation issue diagnosis - Issue #5 verification)
        console.log("[PropertyDetails] Property loaded successfully:", {
          id: data?.id,
          title: data?.title_fr || data?.title,
        });
        setProperty(data ?? null);
        setCurrentImage(0);
      }

      setLoading(false);
    };

    fetchProperty();

    return () => {
      mounted = false;
    };
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-MA", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) return null;

  if (!property) {
    return (
      <div className="container pt-24">
        <p className="text-muted-foreground">Property not found</p>
      </div>
    );
  }

  const images: string[] = Array.isArray(property.images) ? property.images : [];
  const safeImages =
    images.length > 0
      ? images
      : ["https://via.placeholder.com/1200x800?text=No+Image"];

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % safeImages.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  // SEO metadata
  const seoTitle = `${property.title} - ${
    property.neighborhood ? property.neighborhood + ", " : ""
  }${property.city} | TopAffaireImmo`;

  const seoDescription = `${property.property_type || property.type || "Bien"} ${
    property.transaction_type === "sale" || property.priceType === "sale"
      ? "à vendre"
      : "à louer"
  } à ${
    property.neighborhood ? property.neighborhood + ", " : ""
  }${property.city}. ${property.bedrooms || 0} chambres, ${
    property.area || 0
  }m². Prix: ${formatPrice(property.price || 0)} MAD.`;

  const PRICE_VALIDITY_DAYS = 90;
  const priceValidUntil = new Date(
    Date.now() + PRICE_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  const cityData = MOROCCO_CITIES.find(
    (c) => c.name_fr.toLowerCase() === String(property.city || "").toLowerCase()
  );
  const citySlug = cityData?.slug || slugify(property.city || "");
  const neighborhoodSlug = property.neighborhood ? slugify(property.neighborhood) : "";

  const structuredData = useMemo(() => {
    return [
      {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "@id": `https://topaffaireimmo.vercel.app/property/${property.id}`,
        name: property.title,
        description: property.description,
        url: `https://topaffaireimmo.vercel.app/property/${property.id}`,
        offers: {
          "@type": "Offer",
          price: property.price,
          priceCurrency: "MAD",
          availability: "https://schema.org/InStock",
          priceValidUntil: priceValidUntil,
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: property.address,
          addressLocality: property.neighborhood || property.city,
          addressRegion: property.city,
          addressCountry: "MA",
        },
        numberOfRooms: property.bedrooms,
        numberOfBathroomsTotal: property.bathrooms,
        floorSize: {
          "@type": "QuantitativeValue",
          value: property.area,
          unitCode: "MTK",
          unitText: "m²",
        },
        datePosted: property.created_at || new Date().toISOString(),
        image: safeImages.map((img: string, index: number) => ({
          "@type": "ImageObject",
          url: img,
          name: `${property.title} - Image ${index + 1}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: "https://topaffaireimmo.vercel.app/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: property.city,
            item: `https://topaffaireimmo.vercel.app/immobilier/${citySlug}`,
          },
          ...(property.neighborhood && neighborhoodSlug
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: property.neighborhood,
                  item: `https://topaffaireimmo.vercel.app/immobilier/${citySlug}/${neighborhoodSlug}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: property.neighborhood ? 4 : 3,
            name: property.title,
          },
        ],
      },
    ];
  }, [property, citySlug, neighborhoodSlug, priceValidUntil, safeImages]);

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        ogImage={safeImages[0]}
        ogType="product"
        structuredData={structuredData}
        canonical={`/property/${property.id}`}
      />

      <div className="pt-20">
          {/* Breadcrumb Navigation */}
          <section className="container pt-6 pb-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/search">Immobilier</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/immobilier/${citySlug}`}>
                    {property.city}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {property.neighborhood && neighborhoodSlug && (
                  <>
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={`/immobilier/${citySlug}/${neighborhoodSlug}`}
                      >
                        {property.neighborhood}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{property.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </section>

          {/* Image Gallery */}
          <section className="relative bg-foreground">
            <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
              <img
                src={safeImages[currentImage]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

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

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {safeImages.map((_, index) => (
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
                      src={safeImages[index]}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm">
                {currentImage + 1} / {safeImages.length}
              </div>
            </div>
          </section>

          {/* Property Content */}
          <section className="container py-8 md:py-12">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {property.featured && (
                      <Badge className="bg-secondary text-secondary-foreground">
                        Featured
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {property.property_type || property.type}
                    </Badge>
                    <Badge variant="outline">
                      {property.transaction_type === "sale" ||
                      property.priceType === "sale"
                        ? "For Sale"
                        : "For Rent"}
                    </Badge>
                  </div>

                  <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
                    {property.title}
                  </h1>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-5 w-5" />
                    <p className="text-lg">
                      {property.neighborhood && (
                        <>
                          <span className="font-semibold text-foreground">
                            {property.neighborhood}
                          </span>
                          <span className="mx-2">•</span>
                        </>
                      )}
                      {property.city}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <p className="font-mono-price text-3xl md:text-4xl font-semibold text-primary">
                    {formatPrice(property.price || 0)}{" "}
                    <span className="text-lg font-normal text-muted-foreground">
                      MAD
                    </span>
                    {(property.transaction_type === "rent" ||
                      property.priceType === "rent") && (
                      <span className="text-lg font-normal text-muted-foreground">
                        /month
                      </span>
                    )}
                  </p>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <h2 className="font-display text-xl font-semibold mb-4">
                    Property Features
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {property.bedrooms ? (
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Bed className="h-6 w-6 mx-auto text-primary mb-2" />
                        <p className="font-semibold">{property.bedrooms}</p>
                        <p className="text-sm text-muted-foreground">Bedrooms</p>
                      </div>
                    ) : null}

                    {property.bathrooms ? (
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Bath className="h-6 w-6 mx-auto text-primary mb-2" />
                        <p className="font-semibold">{property.bathrooms}</p>
                        <p className="text-sm text-muted-foreground">Bathrooms</p>
                      </div>
                    ) : null}

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Square className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="font-semibold">{property.area} m²</p>
                      <p className="text-sm text-muted-foreground">Living Area</p>
                    </div>

                    {property.year_built ? (
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                        <p className="font-semibold">{property.year_built}</p>
                        <p className="text-sm text-muted-foreground">Year Built</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <h2 className="font-display text-xl font-semibold mb-4">
                    Description
                  </h2>
                  <div className="prose prose-neutral max-w-none">
                    {String(property.description || "")
                      .split("\n")
                      .map((paragraph: string, index: number) => (
                        <p key={index} className="text-muted-foreground">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
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

                <div className="bg-white rounded-xl border p-6 sticky top-24">
                  <h3 className="font-display text-lg font-semibold mb-4">
                    Contact Agent
                  </h3>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {property.contact_name || "Annonceur"}
                      </p>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {property.company_name || "TopAffaireImmo"}
                      </div>
                      {property.advertiser_type && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {property.advertiser_type === "owner"
                              ? "Propriétaire"
                              : property.advertiser_type === "broker"
                              ? "Courtier"
                              : "Agence"}
                          </Badge>
                        </div>
                      )}
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

          <AdBanner page="property" position="before_footer" className="bg-muted/30" />
      </div>
    </>
  );
}
