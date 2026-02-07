import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  Mail,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Building2,
} from "lucide-react";
import { cn, formatWhatsAppLink } from "@/lib/utils";
import { MOROCCO_CITIES, slugify } from "@/lib/seo";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/config/site";
import { trackPropertyView, trackContactClick } from "@/lib/lead-tracking";
import { trackEvent } from "@/lib/analytics/ga4";

// ✅ Helper functions to safely handle null/undefined values
const safeLower = (v?: string | null): string => (v ?? "").toLowerCase();
const safeStr = (v: any): string => (v == null ? "" : String(v));

type DbPropertyDetails = {
  id: string;
  title_fr: string | null;
  title_ar: string | null;

  description_fr?: string | null;
  description_ar?: string | null;

  // ✅ ماكيناش description فـ DB ديالك (حسب لخطأ اللي كان)، نخليوها اختيارية فقط
  description?: string | null;

  price: number | null;
  transaction_type: string | null; // sale / rent
  property_type: string | null;
  status: string | null;

  created_at: string | null;
  images: string[] | null;

  address?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  year_built?: number | null;
  featured?: boolean | null;

  // ✅ مطابقين للي فـ DB (تصاورك)
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  
  // Visibility flags
  show_phone_public?: boolean | null;
  show_whatsapp_public?: boolean | null;
  show_email_public?: boolean | null;

  advertiser_type?: "owner" | "broker" | "agency" | string | null;
  
  // For checking ownership
  owner_id?: string | null;

  // Owner profile data via join
  owner?: {
    company_name?: string | null;
    agency_name?: string | null;
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;

  city?: { name_fr: string | null; name_ar: string | null } | null;
  neighborhood?: { name_fr: string | null; name_ar: string | null } | null;
};

// Type for Supabase response with nested relationships (which return arrays)
type SupabasePropertyResponse = Omit<DbPropertyDetails, 'city' | 'neighborhood' | 'owner'> & {
  city?: { name_fr: string | null; name_ar: string | null }[] | null;
  neighborhood?: { name_fr: string | null; name_ar: string | null }[] | null;
  owner?: {
    company_name?: string | null;
    agency_name?: string | null;
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
  }[] | null;
};

function getPublicImageUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;

  // ✅ نفس اسم البوكت اللي كتستعمل فـ SearchResults
  const result = supabase.storage.from("property-images").getPublicUrl(pathOrUrl);
  return result?.data?.publicUrl || "";
}

export default function PropertyDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState<DbPropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Check if current user is the owner
  const isOwner = useMemo(() => {
    if (!user || !property) return false;
    return user.id === property.owner_id;
  }, [user, property]);

  useEffect(() => {
    let mounted = true;

    const fetchProperty = async () => {
      if (!id) return;

      setLoading(true);
      setLoadError(null);

      try {
        // Use properties_public view for public/anonymous users to respect contact visibility
        // Owners can see their own properties with full contact info from properties table
        const { data, error } = await supabase
          .from("properties_public")
          .select(
            `
            id,
            title_fr,
            title_ar,
            description_fr,
            description_ar,
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
            year_built,
            featured,
            contact_phone,
            contact_whatsapp,
            contact_email,
            show_phone_public,
            show_whatsapp_public,
            show_email_public,
            owner_id,
            advertiser_type,
            city:cities(name_fr, name_ar),
            neighborhood:neighborhoods(name_fr, name_ar)
          `
          )
          .eq("id", id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          setProperty(null);
          setLoadError(error.message);
        } else if (data) {
          // Handle Supabase nested query response - converts arrays to single objects
          const typedData = data as SupabasePropertyResponse;
          setProperty({
            ...typedData,
            city: Array.isArray(typedData?.city) && typedData.city.length > 0 ? typedData.city[0] : typedData?.city,
            neighborhood: Array.isArray(typedData?.neighborhood) && typedData.neighborhood.length > 0 ? typedData.neighborhood[0] : typedData?.neighborhood,
            owner: Array.isArray(typedData?.owner) && typedData.owner.length > 0 ? typedData.owner[0] : typedData?.owner,
          } as DbPropertyDetails);
          setCurrentImage(0);
          
          // Track property view for analytics
          if (id) {
            trackPropertyView(id).catch(err => {
              console.warn('Failed to track property view:', err);
            });
            
            // Track property view in GA4
            trackEvent('property_view', {
              property_id: id
            });
          }
        } else {
          setProperty(null);
        }
      } catch (e: any) {
        if (!mounted) return;
        setProperty(null);
        setLoadError(e?.message || "Unexpected error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProperty();
    return () => {
      mounted = false;
    };
  }, [id]);

  // ✅ useMemo hook MUST run before any conditional returns (Rules of Hooks)
  // All hooks must execute in the same order every render
  const structuredData = useMemo(() => {
    // Guard clause: don't generate structured data if property is null/undefined
    if (!property) {
      return [];
    }

    // Safe value extraction
    const title = property.title_fr || property.title_ar || "Annonce immobilière";
    const description = property.description_fr || property.description_ar || property.description || "";
    
    const rawImages: string[] = Array.isArray(property.images) ? property.images : [];
    const safeImages = rawImages.length > 0
      ? rawImages.map(getPublicImageUrl)
      : ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"];

    const cityNameForSlug = safeStr(property.city?.name_fr);
    const target = safeLower(cityNameForSlug);
    const cityData = target
      ? MOROCCO_CITIES.find(c => safeLower(c?.name_fr) === target)
      : undefined;
    const citySlug = cityData?.slug ?? slugify(cityNameForSlug);

    const neighborhoodNameForSlug = safeStr(property.neighborhood?.name_fr);
    const neighborhoodSlug = neighborhoodNameForSlug ? slugify(neighborhoodNameForSlug) : "";

    const safeTitle = safeStr(title);
    const safeDescription = safeStr(description);
    const safeCityName = safeStr(cityNameForSlug);
    const safeNeighborhoodName = safeStr(neighborhoodNameForSlug);
    const safePrice = property.price ?? 0;
    const safeAddress = safeStr(property.address);
    const safeCreatedAt = safeStr(property.created_at) || new Date().toISOString();

    const PRICE_VALIDITY_DAYS = 90;
    const priceValidUntil = new Date(
      Date.now() + PRICE_VALIDITY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString().split("T")[0];

    return [
      {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "@id": `${SITE_URL}/property/${property.id}`,
        name: safeTitle,
        description: safeDescription,
        url: `${SITE_URL}/property/${property.id}`,
        offers: {
          "@type": "Offer",
          price: safePrice,
          priceCurrency: "MAD",
          availability: "https://schema.org/InStock",
          priceValidUntil,
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: safeAddress,
          addressLocality: safeNeighborhoodName || safeCityName,
          addressRegion: safeCityName,
          addressCountry: "MA",
        },
        numberOfRooms: property.bedrooms ?? undefined,
        numberOfBathroomsTotal: property.bathrooms ?? undefined,
        floorSize: {
          "@type": "QuantitativeValue",
          value: property.area ?? undefined,
          unitCode: "MTK",
          unitText: "m²",
        },
        datePosted: safeCreatedAt,
        image: safeImages.map((img, index) => ({
          "@type": "ImageObject",
          url: img,
          name: `${safeTitle} - Image ${index + 1}`,
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
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: safeCityName || "Ville",
            item: `${SITE_URL}/immobilier/${citySlug}`,
          },
          ...(neighborhoodSlug
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: safeNeighborhoodName,
                  item: `${SITE_URL}/immobilier/${citySlug}/${neighborhoodSlug}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: neighborhoodSlug ? 4 : 3,
            name: safeTitle,
          },
        ],
      },
    ];
  }, [property]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-MA", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(price);

  // ✅ ALL HOOKS ABOVE - CONDITIONAL RETURNS BELOW
  // This ensures hooks are called in the same order every render (Rules of Hooks)

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="pt-28">
        <div className="container">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/2 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-10 w-1/3 bg-muted rounded" />
            <div className="h-24 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ✅ Not found / Not approved / Error
  if (!property) {
    return (
      <div className="pt-28">
        <div className="container max-w-3xl">
          <div className="bg-white rounded-xl border p-8 text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Annonce indisponible
            </h1>
            <p className="text-muted-foreground mt-2">
              {loadError
                ? `Erreur: ${loadError}`
                : "Cet annonce n'existe pas ou n'est pas encore approuvé."}
            </p>
            <div className="mt-6">
              <Button asChild>
                <a href="/search">Retour à la recherche</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Resolve title/desc safely
  const title = property.title_fr || property.title_ar || "Annonce immobilière";

  const description =
    property.description_fr || property.description_ar || property.description || "";

  // ✅ Images safe + convert to public urls
  const rawImages: string[] = Array.isArray(property.images) ? property.images : [];
  const safeImages =
    rawImages.length > 0
      ? rawImages.map(getPublicImageUrl)
      : [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
        ];

  const nextImage = () =>
    setCurrentImage((prev) => (prev + 1) % safeImages.length);

  const prevImage = () =>
    setCurrentImage((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));

  // ✅ Safe city lookup - prevents calling methods on null values
  const cityNameForSlug = safeStr(property.city?.name_fr);
  const target = safeLower(cityNameForSlug);
  const cityData = target
    ? MOROCCO_CITIES.find(c => safeLower(c?.name_fr) === target)
    : undefined;
  const citySlug = cityData?.slug ?? slugify(cityNameForSlug);

  // ✅ Safe neighborhood slug generation
  const neighborhoodNameForSlug = safeStr(property.neighborhood?.name_fr);
  const neighborhoodSlug = neighborhoodNameForSlug
    ? slugify(neighborhoodNameForSlug)
    : "";

  // ✅ Safe labels for display
  const cityLabel = safeStr(property.city?.name_fr);
  const neighborhoodLabel = safeStr(property.neighborhood?.name_fr);

  // ✅ Safe phone numbers with fallbacks and visibility checks
  const phone = safeStr(property.contact_phone);
  const whatsapp = safeStr(property.contact_whatsapp);
  const email = safeStr(property.contact_email);
  
  // Determine if contact info should be shown (owner can always see)
  const shouldShowPhone = isOwner || (property.show_phone_public && phone);
  const shouldShowWhatsapp = isOwner || (property.show_whatsapp_public && whatsapp);
  const shouldShowEmail = isOwner || (property.show_email_public && email);

  // ✅ SEO metadata - safely constructed
  const seoTitle = `${title} - ${
    neighborhoodLabel ? neighborhoodLabel + ", " : ""
  }${cityLabel || ""} | TopAffaireImmo`;

  const seoDescription = `${safeStr(property.property_type) || "Bien"} ${
    property.transaction_type === "sale" ? "à vendre" : "à louer"
  } à ${cityLabel || ""}. ${
    property.bedrooms || 0
  } chambres, ${property.area || 0}m². Prix: ${formatPrice(
    property.price || 0
  )} MAD.`;

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
                  {cityLabel || "Ville"}
                </BreadcrumbLink>
              </BreadcrumbItem>

              {neighborhoodLabel && neighborhoodSlug && (
                <>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/immobilier/${citySlug}/${neighborhoodSlug}`}>
                      {neighborhoodLabel}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}

              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </section>

        {/* Image Gallery */}
        <section className="relative bg-foreground">
          <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
            <img
              src={safeImages[currentImage]}
              alt={`${title} - Image ${currentImage + 1} de ${safeImages.length}`}
              loading="eager"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {safeImages.length > 1 && (
              <>
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
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {safeImages.slice(0, 8).map((_, index) => (
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
                    alt={`${title} - Miniature ${index + 1}`}
                    loading="lazy"
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
                  {!!property.featured && (
                    <Badge className="bg-secondary text-secondary-foreground">
                      Featured
                    </Badge>
                  )}
                  <Badge variant="outline">{property.property_type || "Bien"}</Badge>
                  <Badge variant="outline">
                    {property.transaction_type === "sale" ? "For Sale" : "For Rent"}
                  </Badge>
                </div>

                <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
                  {title}
                </h1>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <p className="text-lg">
                    {neighborhoodLabel && (
                      <>
                        <span className="font-semibold text-foreground">
                          {neighborhoodLabel}
                        </span>
                        <span className="mx-2">•</span>
                      </>
                    )}
                    {cityLabel}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <p className="font-mono-price text-3xl md:text-4xl font-semibold text-primary">
                  {formatPrice(property.price || 0)}{" "}
                  <span className="text-lg font-normal text-muted-foreground">
                    MAD
                  </span>
                  {property.transaction_type === "rent" && (
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
                  {!!property.bedrooms && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Bed className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="font-semibold">{property.bedrooms}</p>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                    </div>
                  )}

                  {!!property.bathrooms && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Bath className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="font-semibold">{property.bathrooms}</p>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                    </div>
                  )}

                  {!!property.area && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Square className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="font-semibold">{property.area} m²</p>
                      <p className="text-sm text-muted-foreground">Living Area</p>
                    </div>
                  )}

                  {!!property.year_built && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="font-semibold">{property.year_built}</p>
                      <p className="text-sm text-muted-foreground">Year Built</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-display text-xl font-semibold mb-4">
                  Description
                </h2>
                <div className="prose prose-neutral max-w-none">
                  {safeStr(description)
                    .split("\n")
                    .filter(Boolean)
                    .map((paragraph, index) => (
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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => {
                    try {
                      navigator.share?.({
                        title,
                        url: window.location.href,
                      });
                    } catch {
                      navigator.clipboard?.writeText(window.location.href);
                    }
                  }}
                >
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
                    <p className="font-semibold">Annonceur</p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      TopAffaireImmo
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
                  {shouldShowPhone && phone && (
                    <Button 
                      className="w-full gap-2" 
                      size="lg" 
                      asChild 
                      onClick={() => {
                        if (id && phone) {
                          trackContactClick(id, 'phone').catch(err => {
                            console.warn('Failed to track phone click:', err);
                          });
                          
                          // Track in GA4
                          trackEvent('phone_click', {
                            page: 'property_details',
                            property_id: id
                          });
                        }
                      }}
                    >
                      <a href={`tel:${phone}`}>
                        <Phone className="h-5 w-5" />
                        Call Now
                      </a>
                    </Button>
                  )}

                  {shouldShowWhatsapp && whatsapp && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-green-600 border-green-600 hover:bg-green-50"
                      size="lg"
                      asChild
                      onClick={() => {
                        if (id && whatsapp) {
                          trackContactClick(id, 'whatsapp').catch(err => {
                            console.warn('Failed to track whatsapp click:', err);
                          });
                          
                          // Track in GA4
                          trackEvent('whatsapp_click', {
                            page: 'property_details',
                            property_id: id
                          });
                        }
                      }}
                    >
                      <a
                        href={formatWhatsAppLink(whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-5 w-5" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  
                  {shouldShowEmail && email && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                      asChild
                      onClick={() => {
                        if (id && email) {
                          trackContactClick(id, 'email').catch(err => {
                            console.warn('Failed to track email click:', err);
                          });
                          
                          // Track in GA4
                          trackEvent('email_click', {
                            page: 'property_details',
                            property_id: id
                          });
                        }
                      }}
                    >
                      <a href={`mailto:${email}`}>
                        <Mail className="h-5 w-5" />
                        Email
                      </a>
                    </Button>
                  )}
                  
                  {!shouldShowPhone && !shouldShowWhatsapp && !shouldShowEmail && (
                    <div className="space-y-2">
                      <Button className="w-full gap-2" size="lg" disabled>
                        تواصل عبر المنصة
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        {isOwner 
                          ? "Activez au moins un moyen de contact dans vos paramètres"
                          : "L'annonceur n'a pas partagé ses coordonnées"}
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Available 9AM - 7PM, Mon - Sat
                </p>
              </div>
            </div>
          </div>
        </section>

        <AdBanner
          page="property"
          position="before_footer"
          className="bg-muted/30"
        />
      </div>
    </>
  );
}
