import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import AdvertiserLayout from "@/components/layout/AdvertiserLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Rocket,
  Star,
  Zap,
  Crown,
  Eye,
  TrendingUp,
  Check,
  Clock,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock listings that can be boosted
const mockListings = [
  {
    id: "1",
    title: "Appartement 3 chambres - Maarif",
    price: 1500000,
    views: 234,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80",
    boosted: false,
  },
  {
    id: "2",
    title: "Villa moderne avec piscine - Anfa",
    price: 4500000,
    views: 456,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
    boosted: true,
    boostExpires: "2024-01-25",
  },
  {
    id: "3",
    title: "Bureau 100m² - Centre ville",
    price: 12000,
    views: 89,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
    boosted: false,
  },
];

const boostPlans = [
  {
    id: "basic",
    nameFr: "Boost Standard",
    nameAr: "تعزيز أساسي",
    duration: 7,
    price: 99,
    features: [
      { fr: "Visibilité x2", ar: "رؤية ×2" },
      { fr: "Badge \"En vedette\"", ar: "شارة \"مميز\"" },
      { fr: "Position prioritaire", ar: "موقع متقدم" },
    ],
    popular: false,
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "premium",
    nameFr: "Boost Premium",
    nameAr: "تعزيز متميز",
    duration: 14,
    price: 179,
    features: [
      { fr: "Visibilité x4", ar: "رؤية ×4" },
      { fr: "Badge \"Premium\"", ar: "شارة \"متميز\"" },
      { fr: "Top des résultats", ar: "أعلى النتائج" },
      { fr: "Promotion réseaux sociaux", ar: "ترويج عبر التواصل الاجتماعي" },
    ],
    popular: true,
    color: "bg-primary/5 border-primary/20",
  },
  {
    id: "ultimate",
    nameFr: "Boost Ultimate",
    nameAr: "تعزيز نهائي",
    duration: 30,
    price: 299,
    features: [
      { fr: "Visibilité x6", ar: "رؤية ×6" },
      { fr: "Badge \"Exclusif\"", ar: "شارة \"حصري\"" },
      { fr: "Homepage showcase", ar: "عرض في الصفحة الرئيسية" },
      { fr: "Newsletter feature", ar: "ظهور في النشرة الإخبارية" },
      { fr: "Rapport de performance", ar: "تقرير الأداء" },
    ],
    popular: false,
    color: "bg-yellow-50 border-yellow-200",
  },
];

export default function AdvertiserBoost() {
  const { isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("premium");

  const handleBoost = () => {
    if (!selectedListing) {
      toast.error(
        isRTL ? "الرجاء اختيار إعلان" : "Veuillez sélectionner une annonce"
      );
      return;
    }
    toast.success(
      isRTL
        ? "تم تفعيل التعزيز بنجاح!"
        : "Boost activé avec succès !"
    );
  };

  const currentPlan = boostPlans.find((p) => p.id === selectedPlan);

  return (
    <AdvertiserLayout>
      <div className="p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">
              {isRTL ? "تعزيز إعلاناتك" : "Booster vos annonces"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL
                ? "زد من ظهور إعلاناتك واحصل على المزيد من العملاء"
                : "Augmentez la visibilité de vos annonces et obtenez plus de leads"}
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-6">
              <Eye className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {isRTL ? "رؤية متزايدة" : "Visibilité accrue"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? "احصل على مشاهدات أكثر بـ 6 مرات"
                  : "Obtenez jusqu'à 6x plus de vues"}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-6">
              <TrendingUp className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {isRTL ? "المزيد من العملاء" : "Plus de leads"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? "زيادة بنسبة 300% في الاتصالات"
                  : "+300% de contacts en moyenne"}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-6">
              <Sparkles className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {isRTL ? "تميز عن المنافسين" : "Démarquez-vous"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? "شارات مميزة وموقع متقدم"
                  : "Badges exclusifs et position prioritaire"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Select Listing */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRTL ? "1. اختر إعلان" : "1. Choisissez une annonce"}
                </CardTitle>
                <CardDescription>
                  {isRTL
                    ? "حدد الإعلان الذي تريد تعزيزه"
                    : "Sélectionnez l'annonce à booster"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockListings.map((listing) => (
                  <div
                    key={listing.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                      selectedListing === listing.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50",
                      listing.boosted && "opacity-60 cursor-not-allowed"
                    )}
                    onClick={() =>
                      !listing.boosted && setSelectedListing(listing.id)
                    }
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {listing.title}
                      </h3>
                      <p className="text-lg font-bold text-primary">
                        {listing.price.toLocaleString()} DH
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {listing.views} {isRTL ? "مشاهدة" : "vues"}
                      </p>
                    </div>
                    {listing.boosted ? (
                      <Badge className="bg-green-100 text-green-700">
                        <Rocket className="w-3 h-3 mr-1" />
                        {isRTL ? "معزز" : "Boosté"}
                      </Badge>
                    ) : (
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                          selectedListing === listing.id
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {selectedListing === listing.id && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Select Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRTL ? "2. اختر خطة التعزيز" : "2. Choisissez votre formule"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedPlan}
                  onValueChange={setSelectedPlan}
                  className="grid gap-4"
                >
                  {boostPlans.map((plan) => (
                    <div key={plan.id} className="relative">
                      <RadioGroupItem
                        value={plan.id}
                        id={plan.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={plan.id}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                          plan.color,
                          "peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary"
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {isRTL ? plan.nameAr : plan.nameFr}
                            </h3>
                            {plan.popular && (
                              <Badge className="bg-primary">
                                {isRTL ? "الأكثر شعبية" : "Populaire"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {plan.duration} {isRTL ? "يوم" : "jours"}
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {plan.features.map((feature, idx) => (
                              <li
                                key={idx}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Check className="w-4 h-4 text-green-600" />
                                {isRTL ? feature.ar : feature.fr}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {plan.price}
                          </p>
                          <p className="text-sm text-muted-foreground">DH</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRTL ? "ملخص الطلب" : "Récapitulatif"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedListing ? (
                  <>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">
                        {isRTL ? "الإعلان المحدد:" : "Annonce sélectionnée:"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {
                          mockListings.find((l) => l.id === selectedListing)
                            ?.title
                        }
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">
                        {isRTL ? "الخطة:" : "Formule:"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? currentPlan?.nameAr : currentPlan?.nameFr}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentPlan?.duration} {isRTL ? "يوم" : "jours"}
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium">
                          {isRTL ? "المجموع:" : "Total:"}
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {currentPlan?.price} DH
                        </span>
                      </div>
                      <Button className="w-full gap-2" onClick={handleBoost}>
                        <Rocket className="w-4 h-4" />
                        {isRTL ? "تفعيل التعزيز" : "Activer le boost"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Rocket className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {isRTL
                        ? "اختر إعلان للمتابعة"
                        : "Sélectionnez une annonce pour continuer"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdvertiserLayout>
  );
}
