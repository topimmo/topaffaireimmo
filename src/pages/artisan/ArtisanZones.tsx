import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ArtisanLayout from "@/components/layout/ArtisanLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Plus,
  Trash2,
  Save,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock data - in production, fetch from Supabase
const mockCities = [
  {
    id: 1,
    nameFr: "Casablanca",
    nameAr: "الدار البيضاء",
    neighborhoods: [
      { id: 1, nameFr: "Maarif", nameAr: "المعاريف" },
      { id: 2, nameFr: "Anfa", nameAr: "أنفا" },
      { id: 3, nameFr: "Ain Diab", nameAr: "عين الذئاب" },
      { id: 4, nameFr: "Bourgogne", nameAr: "بورغون" },
      { id: 5, nameFr: "Gauthier", nameAr: "ڭوتييه" },
      { id: 6, nameFr: "Racine", nameAr: "راسين" },
      { id: 7, nameFr: "Oasis", nameAr: "الواحة" },
      { id: 8, nameFr: "Ain Chock", nameAr: "عين الشق" },
    ],
  },
  {
    id: 2,
    nameFr: "Rabat",
    nameAr: "الرباط",
    neighborhoods: [
      { id: 9, nameFr: "Agdal", nameAr: "أكدال" },
      { id: 10, nameFr: "Hassan", nameAr: "حسان" },
      { id: 11, nameFr: "Souissi", nameAr: "السويسي" },
      { id: 12, nameFr: "Hay Riad", nameAr: "حي الرياض" },
      { id: 13, nameFr: "Yacoub El Mansour", nameAr: "يعقوب المنصور" },
    ],
  },
  {
    id: 3,
    nameFr: "Marrakech",
    nameAr: "مراكش",
    neighborhoods: [
      { id: 14, nameFr: "Guéliz", nameAr: "جليز" },
      { id: 15, nameFr: "Hivernage", nameAr: "الحي الشتوي" },
      { id: 16, nameFr: "Médina", nameAr: "المدينة القديمة" },
      { id: 17, nameFr: "Palmeraie", nameAr: "النخيل" },
    ],
  },
  {
    id: 4,
    nameFr: "Tanger",
    nameAr: "طنجة",
    neighborhoods: [
      { id: 18, nameFr: "Malabata", nameAr: "ملاباطا" },
      { id: 19, nameFr: "Iberia", nameAr: "إيبيريا" },
      { id: 20, nameFr: "Médina", nameAr: "المدينة القديمة" },
    ],
  },
];

interface SelectedZone {
  cityId: number;
  neighborhoodIds: number[];
  active: boolean;
}

export default function ArtisanZones() {
  const { isRTL } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [expandedCities, setExpandedCities] = useState<number[]>([1]);
  const [selectedZones, setSelectedZones] = useState<SelectedZone[]>([
    { cityId: 1, neighborhoodIds: [1, 2, 3], active: true },
    { cityId: 2, neighborhoodIds: [9, 10], active: true },
  ]);
  const [selectedCity, setSelectedCity] = useState<string>("");

  const toggleCityExpand = (cityId: number) => {
    setExpandedCities((prev) =>
      prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId]
    );
  };

  const addCity = (cityId: string) => {
    const id = parseInt(cityId);
    if (!selectedZones.find((z) => z.cityId === id)) {
      setSelectedZones([
        ...selectedZones,
        { cityId: id, neighborhoodIds: [], active: true },
      ]);
      setExpandedCities([...expandedCities, id]);
    }
    setSelectedCity("");
  };

  const removeCity = (cityId: number) => {
    setSelectedZones(selectedZones.filter((z) => z.cityId !== cityId));
    setExpandedCities(expandedCities.filter((id) => id !== cityId));
  };

  const toggleNeighborhood = (cityId: number, neighborhoodId: number) => {
    setSelectedZones((prev) =>
      prev.map((zone) => {
        if (zone.cityId !== cityId) return zone;
        const hasNeighborhood = zone.neighborhoodIds.includes(neighborhoodId);
        return {
          ...zone,
          neighborhoodIds: hasNeighborhood
            ? zone.neighborhoodIds.filter((id) => id !== neighborhoodId)
            : [...zone.neighborhoodIds, neighborhoodId],
        };
      })
    );
  };

  const toggleCityActive = (cityId: number) => {
    setSelectedZones((prev) =>
      prev.map((zone) =>
        zone.cityId === cityId ? { ...zone, active: !zone.active } : zone
      )
    );
  };

  const selectAllNeighborhoods = (cityId: number) => {
    const city = mockCities.find((c) => c.id === cityId);
    if (!city) return;
    setSelectedZones((prev) =>
      prev.map((zone) =>
        zone.cityId === cityId
          ? { ...zone, neighborhoodIds: city.neighborhoods.map((n) => n.id) }
          : zone
      )
    );
  };

  const deselectAllNeighborhoods = (cityId: number) => {
    setSelectedZones((prev) =>
      prev.map((zone) =>
        zone.cityId === cityId ? { ...zone, neighborhoodIds: [] } : zone
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success(isRTL ? "تم حفظ المناطق" : "Zones enregistrées");
  };

  const totalNeighborhoods = selectedZones.reduce(
    (acc, zone) => acc + zone.neighborhoodIds.length,
    0
  );

  const availableCities = mockCities.filter(
    (city) => !selectedZones.find((z) => z.cityId === city.id)
  );

  return (
    <ArtisanLayout>
      <div className="p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">
              {isRTL ? "مناطق التدخل" : "Zones d'intervention"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL 
                ? "حدد المدن والأحياء التي تعمل فيها"
                : "Définissez les villes et quartiers où vous intervenez"}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isRTL ? "جاري الحفظ..." : "Enregistrement..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isRTL ? "حفظ التغييرات" : "Enregistrer"}
              </>
            )}
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{selectedZones.length}</p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "مدن" : "Villes"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalNeighborhoods}</p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "أحياء" : "Quartiers"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {selectedZones.filter((z) => z.active).length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "نشط" : "Actives"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">~15K</p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "مشاهدات/شهر" : "Vues/mois"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Selected Zones */}
          <div className="lg:col-span-2 space-y-4">
            {/* Add City */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Select value={selectedCity} onValueChange={addCity}>
                    <SelectTrigger className="flex-1">
                      <Plus className="w-4 h-4 mr-2" />
                      <SelectValue
                        placeholder={
                          isRTL ? "إضافة مدينة جديدة" : "Ajouter une ville"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {isRTL ? city.nameAr : city.nameFr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* City Cards */}
            {selectedZones.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {isRTL
                      ? "لم تحدد أي منطقة بعد. أضف مدينة للبدء."
                      : "Vous n'avez pas encore défini de zone. Ajoutez une ville pour commencer."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              selectedZones.map((zone) => {
                const city = mockCities.find((c) => c.id === zone.cityId);
                if (!city) return null;
                const isExpanded = expandedCities.includes(city.id);

                return (
                  <Card
                    key={city.id}
                    className={cn(!zone.active && "opacity-60")}
                  >
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleCityExpand(city.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              zone.active ? "bg-primary/10" : "bg-muted"
                            )}
                          >
                            <MapPin
                              className={cn(
                                "w-5 h-5",
                                zone.active
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {isRTL ? city.nameAr : city.nameFr}
                            </CardTitle>
                            <CardDescription>
                              {zone.neighborhoodIds.length} / {city.neighborhoods.length}{" "}
                              {isRTL ? "حي محدد" : "quartiers sélectionnés"}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={zone.active ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCityActive(city.id);
                            }}
                          >
                            {zone.active
                              ? isRTL
                                ? "نشط"
                                : "Actif"
                              : isRTL
                              ? "غير نشط"
                              : "Inactif"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCity(city.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        <div className="flex gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllNeighborhoods(city.id)}
                          >
                            {isRTL ? "تحديد الكل" : "Tout sélectionner"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deselectAllNeighborhoods(city.id)}
                          >
                            {isRTL ? "إلغاء التحديد" : "Tout désélectionner"}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {city.neighborhoods.map((neighborhood) => {
                            const isSelected = zone.neighborhoodIds.includes(
                              neighborhood.id
                            );
                            return (
                              <label
                                key={neighborhood.id}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                  isSelected
                                    ? "bg-primary/5 border-primary/30"
                                    : "hover:bg-muted"
                                )}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    toggleNeighborhood(city.id, neighborhood.id)
                                  }
                                />
                                <span className="text-sm font-medium">
                                  {isRTL
                                    ? neighborhood.nameAr
                                    : neighborhood.nameFr}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>

          {/* Preview Card */}
          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {isRTL ? "معاينة" : "Aperçu"}
                </CardTitle>
                <CardDescription>
                  {isRTL
                    ? "هكذا ستظهر مناطقك للعملاء"
                    : "Voici comment vos zones apparaîtront aux clients"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {selectedZones.filter((z) => z.active).length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {isRTL
                          ? "لا توجد مناطق نشطة"
                          : "Aucune zone active"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedZones
                        .filter((z) => z.active)
                        .map((zone) => {
                          const city = mockCities.find(
                            (c) => c.id === zone.cityId
                          );
                          if (!city) return null;
                          const selectedNeighborhoods = city.neighborhoods.filter(
                            (n) => zone.neighborhoodIds.includes(n.id)
                          );

                          return (
                            <div key={city.id}>
                              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                {isRTL ? city.nameAr : city.nameFr}
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedNeighborhoods.length === 0 ? (
                                  <Badge variant="outline" className="text-xs">
                                    {isRTL
                                      ? "لم يتم تحديد أحياء"
                                      : "Aucun quartier sélectionné"}
                                  </Badge>
                                ) : (
                                  selectedNeighborhoods.map((n) => (
                                    <Badge
                                      key={n.id}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {isRTL ? n.nameAr : n.nameFr}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ArtisanLayout>
  );
}
