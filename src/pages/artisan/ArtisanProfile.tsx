import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import ArtisanLayout from "@/components/layout/ArtisanLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Camera,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Building2,
  Globe,
  Instagram,
  Facebook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const serviceCategories = [
  { value: "plomberie", labelFr: "Plomberie", labelAr: "السباكة" },
  { value: "electricite", labelFr: "Électricité", labelAr: "الكهرباء" },
  { value: "peinture", labelFr: "Peinture", labelAr: "الدهان" },
  { value: "climatisation", labelFr: "Climatisation", labelAr: "تكييف الهواء" },
  { value: "menuiserie", labelFr: "Menuiserie", labelAr: "النجارة" },
  { value: "maconnerie", labelFr: "Maçonnerie", labelAr: "البناء" },
  { value: "nettoyage", labelFr: "Nettoyage", labelAr: "التنظيف" },
  { value: "jardinage", labelFr: "Jardinage", labelAr: "البستنة" },
];

export default function ArtisanProfile() {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>(["plomberie", "electricite"]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || "",
    phone: user?.user_metadata?.phone || "",
    email: user?.email || "",
    bio: "",
    experience: "5",
    city: "casablanca",
    address: "",
    website: "",
    instagram: "",
    facebook: "",
    workingHours: "08:00-18:00",
    workingDays: "lundi-samedi",
  });

  const profileCompletion = calculateProfileCompletion();

  function calculateProfileCompletion() {
    const fields = [
      formData.fullName,
      formData.phone,
      formData.email,
      formData.bio,
      formData.city,
      selectedServices.length > 0,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success(isRTL ? "تم حفظ الملف الشخصي" : "Profil enregistré");
  };

  const addService = (value: string) => {
    if (!selectedServices.includes(value)) {
      setSelectedServices([...selectedServices, value]);
    }
  };

  const removeService = (value: string) => {
    setSelectedServices(selectedServices.filter((s) => s !== value));
  };

  return (
    <ArtisanLayout>
      <div className="p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">
              {isRTL ? "الملف الشخصي" : "Mon profil"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL 
                ? "أكمل ملفك الشخصي لجذب المزيد من العملاء" 
                : "Complétez votre profil pour attirer plus de clients"}
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

        {/* Profile Completion */}
        <Card className={cn(
          "border-2",
          profileCompletion === 100 ? "border-green-200 bg-green-50/50" : "border-primary/20 bg-primary/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-3">
              {profileCompletion === 100 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-primary" />
              )}
              <span className="font-medium">
                {profileCompletion === 100
                  ? (isRTL ? "ملفك الشخصي مكتمل!" : "Votre profil est complet !")
                  : (isRTL ? "أكمل ملفك الشخصي" : "Complétez votre profil")}
              </span>
              <Badge variant={profileCompletion === 100 ? "default" : "secondary"}>
                {profileCompletion}%
              </Badge>
            </div>
            <Progress value={profileCompletion} className="h-2" />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Basic Info */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative inline-block">
                  <Avatar className="w-32 h-32 mx-auto">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                      {formData.fullName?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full w-10 h-10"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-semibold text-lg mt-4">{formData.fullName || "Artisan"}</h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary">
                    <Wrench className="w-3 h-3 mr-1" />
                    {isRTL ? "حرفي" : "Artisan"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isRTL ? "معلومات الاتصال" : "Contact"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    {isRTL ? "الهاتف" : "Téléphone"}
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+212 6XX XXX XXX"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    {isRTL ? "البريد الإلكتروني" : "Email"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isRTL ? "الروابط الاجتماعية" : "Réseaux sociaux"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">
                    <Globe className="w-4 h-4 inline mr-2" />
                    {isRTL ? "الموقع الإلكتروني" : "Site web"}
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">
                    <Instagram className="w-4 h-4 inline mr-2" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@username"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">
                    <Facebook className="w-4 h-4 inline mr-2" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="facebook.com/..."
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? "المعلومات الأساسية" : "Informations de base"}</CardTitle>
                <CardDescription>
                  {isRTL 
                    ? "هذه المعلومات ستظهر في صفحتك العامة"
                    : "Ces informations seront affichées sur votre page publique"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      {isRTL ? "الاسم الكامل" : "Nom complet"} *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder={isRTL ? "أدخل اسمك" : "Votre nom"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">
                      {isRTL ? "سنوات الخبرة" : "Années d'expérience"}
                    </Label>
                    <Select
                      value={formData.experience}
                      onValueChange={(v) => setFormData({ ...formData, experience: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 10, 15, 20].map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}+ {isRTL ? "سنوات" : "ans"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">
                    {isRTL ? "نبذة عنك" : "À propos de vous"} *
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder={isRTL 
                      ? "اكتب نبذة مختصرة عن خبرتك وخدماتك..."
                      : "Décrivez brièvement votre expérience et vos services..."}
                    rows={4}
                  />
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      {isRTL ? "المدينة" : "Ville"} *
                    </Label>
                    <Select
                      value={formData.city}
                      onValueChange={(v) => setFormData({ ...formData, city: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casablanca">Casablanca</SelectItem>
                        <SelectItem value="rabat">Rabat</SelectItem>
                        <SelectItem value="marrakech">Marrakech</SelectItem>
                        <SelectItem value="tanger">Tanger</SelectItem>
                        <SelectItem value="fes">Fès</SelectItem>
                        <SelectItem value="agadir">Agadir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      {isRTL ? "العنوان" : "Adresse"}
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder={isRTL ? "العنوان الكامل" : "Adresse complète"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? "الخدمات المقدمة" : "Services proposés"}</CardTitle>
                <CardDescription>
                  {isRTL 
                    ? "اختر الخدمات التي تقدمها"
                    : "Sélectionnez les services que vous proposez"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Services */}
                <div className="flex flex-wrap gap-2">
                  {selectedServices.map((service) => {
                    const cat = serviceCategories.find((c) => c.value === service);
                    return (
                      <Badge
                        key={service}
                        variant="secondary"
                        className="px-3 py-1.5 text-sm flex items-center gap-2"
                      >
                        <Wrench className="w-3 h-3" />
                        {isRTL ? cat?.labelAr : cat?.labelFr}
                        <button
                          onClick={() => removeService(service)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>

                {/* Add Service */}
                <Select onValueChange={addService}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <Plus className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={isRTL ? "إضافة خدمة" : "Ajouter un service"} />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories
                      .filter((c) => !selectedServices.includes(c.value))
                      .map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {isRTL ? cat.labelAr : cat.labelFr}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Clock className="w-5 h-5 inline mr-2" />
                  {isRTL ? "ساعات العمل" : "Horaires de travail"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRTL ? "الساعات" : "Heures"}</Label>
                    <Input
                      value={formData.workingHours}
                      onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                      placeholder="08:00 - 18:00"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRTL ? "أيام العمل" : "Jours de travail"}</Label>
                    <Select
                      value={formData.workingDays}
                      onValueChange={(v) => setFormData({ ...formData, workingDays: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lundi-vendredi">
                          {isRTL ? "الإثنين - الجمعة" : "Lundi - Vendredi"}
                        </SelectItem>
                        <SelectItem value="lundi-samedi">
                          {isRTL ? "الإثنين - السبت" : "Lundi - Samedi"}
                        </SelectItem>
                        <SelectItem value="tous-les-jours">
                          {isRTL ? "كل يوم" : "Tous les jours"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ArtisanLayout>
  );
}
