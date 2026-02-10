import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import AdvertiserLayout from "@/components/layout/AdvertiserLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Image,
  Upload,
  Trash2,
  Search,
  Grid,
  List,
  Check,
  X,
  Folder,
  Plus,
  MoreVertical,
  Download,
  Copy,
  ImagePlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock media data
const mockMedia = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80",
    name: "appartement-1.jpg",
    size: "1.2 MB",
    date: "2024-01-15",
    used: true,
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
    name: "villa-anfa.jpg",
    size: "2.4 MB",
    date: "2024-01-14",
    used: true,
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
    name: "bureau-centre.jpg",
    size: "890 KB",
    date: "2024-01-13",
    used: true,
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80",
    name: "salon-moderne.jpg",
    size: "1.5 MB",
    date: "2024-01-12",
    used: false,
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400&q=80",
    name: "chambre-1.jpg",
    size: "980 KB",
    date: "2024-01-11",
    used: false,
  },
  {
    id: "6",
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80",
    name: "salle-bain.jpg",
    size: "750 KB",
    date: "2024-01-10",
    used: true,
  },
];

export default function AdvertiserMedia() {
  const { isRTL } = useLanguage();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const filteredMedia = mockMedia.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    // Handle file upload
    toast.success(
      isRTL
        ? `تم تحميل ${files.length} ملف(ات)`
        : `${files.length} fichier(s) téléchargé(s)`
    );
  }, [isRTL]);

  const deleteSelected = () => {
    toast.success(
      isRTL
        ? `تم حذف ${selectedImages.length} صورة`
        : `${selectedImages.length} image(s) supprimée(s)`
    );
    setSelectedImages([]);
  };

  const totalSize = mockMedia.reduce((acc, item) => {
    const size = parseFloat(item.size);
    const unit = item.size.includes("MB") ? 1024 : 1;
    return acc + size * unit;
  }, 0);

  return (
    <AdvertiserLayout>
      <div className="p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">
              {isRTL ? "مكتبة الوسائط" : "Médiathèque"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL
                ? "إدارة جميع صور إعلاناتك"
                : "Gérez toutes les images de vos annonces"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              {isRTL ? "رفع صور" : "Télécharger"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Image className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockMedia.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "إجمالي الصور" : "Total images"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {mockMedia.filter((m) => m.used).length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "مستخدمة" : "Utilisées"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(totalSize / 1024).toFixed(1)} MB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "إجمالي الحجم" : "Taille totale"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">50 MB</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "المتاح" : "Disponible"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Zone */}
        <Card
          className={cn(
            "border-2 border-dashed transition-colors",
            isDragging && "border-primary bg-primary/5"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">
              {isRTL ? "اسحب وأفلت الصور هنا" : "Glissez-déposez vos images ici"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRTL
                ? "أو انقر لاختيار الملفات (JPG, PNG حتى 5 ميجابايت)"
                : "ou cliquez pour sélectionner (JPG, PNG jusqu'à 5 MB)"}
            </p>
            <Button variant="outline">
              {isRTL ? "اختيار الملفات" : "Sélectionner des fichiers"}
            </Button>
          </CardContent>
        </Card>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? "بحث في الصور..." : "Rechercher..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedImages.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelected}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isRTL
                  ? `حذف (${selectedImages.length})`
                  : `Supprimer (${selectedImages.length})`}
              </Button>
            )}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Media Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "relative group aspect-square rounded-lg overflow-hidden border cursor-pointer",
                  selectedImages.includes(item.id) && "ring-2 ring-primary"
                )}
                onClick={() => toggleSelect(item.id)}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" className="w-8 h-8">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="w-8 h-8">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="w-8 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.success(isRTL ? "تم حذف الصورة" : "Image supprimée");
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {/* Selection indicator */}
                <div
                  className={cn(
                    "absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                    selectedImages.includes(item.id)
                      ? "bg-primary border-primary"
                      : "bg-white/80 border-white/80"
                  )}
                >
                  {selectedImages.includes(item.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                {/* Used badge */}
                {item.used && (
                  <Badge className="absolute bottom-2 right-2 text-xs">
                    {isRTL ? "مستخدمة" : "Utilisée"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer",
                      selectedImages.includes(item.id) && "bg-primary/5"
                    )}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                        selectedImages.includes(item.id)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {selectedImages.includes(item.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.size} •{" "}
                        {new Date(item.date).toLocaleDateString(
                          isRTL ? "ar-MA" : "fr-FR"
                        )}
                      </p>
                    </div>
                    {item.used && (
                      <Badge variant="secondary">
                        {isRTL ? "مستخدمة" : "Utilisée"}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          {isRTL ? "تحميل" : "Télécharger"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          {isRTL ? "نسخ الرابط" : "Copier le lien"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isRTL ? "حذف" : "Supprimer"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdvertiserLayout>
  );
}
