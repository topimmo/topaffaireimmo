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
import { SITE_URL } from "@/config/site";

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

  advertiser_type?: "owner" | "broker" | "agency" | string | null;

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

function getPublicImageUrl(pathOrUrl: string) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;

  // ✅ نفس اسم البوكت اللي كتستعمل فـ SearchResults
  return supabase.storage.from("property-images").getPublicUrl(pathOrUrl).data
    .publicUrl;
}

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState<DbPropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchProperty = async () => {
      if (!id) return;

      setLoading(true);
      setLoadError(null);

      try {
        const { data, error } = await supabase
          .from("properties")
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
            advertiser_type,
            owner:profiles(company_name, agency_name, full_name, phone, email),
            city:cities(name_fr, name_ar),
            neighborhood:neighborhoods(name_fr, name_ar)
          `
          )
          .eq("id", id)
          // Only show published properties on public property details page
          .eq("status", "published")
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          setProperty(null);
          setLoadError(error.message);
        } else {
          setProperty((data as DbPropertyDetails) ?? null);
          setCurrentImage(0);
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-MA", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(price);

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

  // SEO metadata
  const seoTitle = `${title} - ${
    property.neighborhood?.name_fr ? property.neighborhood.name_fr + ", " : ""
  }${property.city?.name_fr || ""} | TopAffaireImmo`;

  const seoDescription = `${property.property_type || "Bien"} ${
    property.transaction_type === "sale" ? "à vendre" : "à louer"
  } à ${property.city?.name_fr || ""}. ${
    property.bedrooms || 0
  } chambres, ${property.area || 0}m². Prix: ${formatPrice(
    property.price || 0
  )} MAD.`;

  const PRICE_VALIDITY_DAYS = 90;
  const priceValidUntil = new Date(
    Date.now() + PRICE_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  const cityNameForSlug = property.city?.name_fr || "";
  const cityData = MOROCCO_CITIES.find(
    (c) => c.name_fr.toLowerCase() === cityNameForSlug.toLowerCase()
  );
  const citySlug = cityData?.slug || slugify(cityNameForSlug);

  const neighborhoodNameForSlug = property.neighborhood?.name_fr || "";
  const neighborhoodSlug = neighborhoodNameForSlug
    ? slugify(neighborhoodNameForSlug)
    : "";

  const structuredData = useMemo(() => {
    return [
      {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "@id": `${SITE_URL}/property/${property.id}`,
        name: title,
        description: description,
        url: `${SITE_URL}/property/${property.id}`,
        offers: {
          "@type": "Offer",
          price: property.price ?? 0,
          priceCurrency: "MAD",
          availability: "https://schema.org/InStock",
          priceValidUntil,
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: property.address || "",
          addressLocality: neighborhoodNameForSlug || cityNameForSlug,
          addressRegion: cityNameForSlug,
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
        datePosted: property.created_at || new Date().toISOString(),
        image: safeImages.map((img, index) => ({
          "@type": "ImageObject",
          url: img,
          name: `${title} - Image ${index + 1}`,
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
            name: cityNameForSlug || "Ville",
            item: `${SITE_URL}/immobilier/${citySlug}`,
          },
          ...(neighborhoodSlug
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: neighborhoodNameForSlug,
                  item: `${SITE_URL}/immobilier/${citySlug}/${neighborhoodSlug}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: neighborhoodSlug ? 4 : 3,
            name: title,
          },
        ],
      },
    ];
  }, [
    property,
    title,
    description,
    priceValidUntil,
    safeImages,
    citySlug,
    neighborhoodSlug,
    cityNameForSlug,
    neighborhoodNameForSlug,
  ]);

  const cityLabel = property.city?.name_fr || "";
  const neighborhoodLabel = property.neighborhood?.name_fr || "";

  // ✅ هنا التصحيح الكبير: نفس أسماء الأعمدة ديال DB
  const phone = property.contact_phone || "";
  const whatsapp = property.contact_whatsapp || "";

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
              alt={title}
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
                  {String(description)
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
                      {property.owner?.company_name || property.owner?.agency_name || "TopAffaireImmo"}
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
                  <Button className="w-full gap-2" size="lg" asChild disabled={!phone}>
                    <a href={phone ? `tel:${phone}` : "#"}>
                      <Phone className="h-5 w-5" />
                      Call Now
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2 text-green-600 border-green-600 hover:bg-green-50"
                    size="lg"
                    asChild
                    disabled={!whatsapp}
                  >
                    <a
                      href={
                        whatsapp
                          ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`
                          : "#"
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp
                    </a>
                  </Button>
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
