import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import ArtisanLayout from "@/components/layout/ArtisanLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  MousePointer,
  Phone,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data - in production, fetch from Supabase
const mockStats = {
  views: { value: 1247, change: 12.5, trend: "up" },
  clicks: { value: 342, change: 8.2, trend: "up" },
  calls: { value: 28, change: -3.1, trend: "down" },
  messages: { value: 45, change: 15.7, trend: "up" },
};

const mockLeads = [
  {
    id: "1",
    type: "call",
    name: "Ahmed B.",
    date: "2024-01-15T10:30:00",
    status: "new",
    service: "Plomberie",
  },
  {
    id: "2",
    type: "whatsapp",
    name: "Fatima M.",
    date: "2024-01-15T09:15:00",
    status: "new",
    service: "Électricité",
  },
  {
    id: "3",
    type: "message",
    name: "Youssef K.",
    date: "2024-01-14T16:45:00",
    status: "in_progress",
    service: "Plomberie",
  },
  {
    id: "4",
    type: "call",
    name: "Sara L.",
    date: "2024-01-14T14:20:00",
    status: "completed",
    service: "Peinture",
  },
];

const mockZones = [
  { city: "Casablanca", neighborhoods: 5, active: true },
  { city: "Rabat", neighborhoods: 3, active: true },
  { city: "Mohammedia", neighborhoods: 2, active: false },
];

export default function ArtisanDashboard() {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const profileCompletion = 75; // Calculate based on user data

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-700">{isRTL ? "جديد" : "Nouveau"}</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-700">{isRTL ? "قيد التنفيذ" : "En cours"}</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">{isRTL ? "مكتمل" : "Terminé"}</Badge>;
      default:
        return null;
    }
  };

  const getLeadIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="w-4 h-4 text-green-600" />;
      case "whatsapp":
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case "message":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <ArtisanLayout>
      <div className="p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">
              {isRTL ? "مرحباً،" : "Bonjour,"} {user?.user_metadata?.full_name?.split(" ")[0] || "Artisan"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL 
                ? "إليك ملخص نشاطك اليوم" 
                : "Voici le résumé de votre activité aujourd'hui"}
            </p>
          </div>
          <Link to="/artisan/leads">
            <Button className="gap-2">
              {isRTL ? "عرض جميع العملاء" : "Voir tous les leads"}
              <Arrow className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Profile Completion Alert */}
        {profileCompletion < 100 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium">
                    {isRTL ? "أكمل ملفك الشخصي" : "Complétez votre profil"}
                  </span>
                </div>
                <Progress value={profileCompletion} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isRTL 
                    ? `${profileCompletion}% مكتمل - أكمل ملفك للحصول على المزيد من العملاء`
                    : `${profileCompletion}% complété - Complétez votre profil pour plus de leads`}
                </p>
              </div>
              <Link to="/artisan/profile">
                <Button variant="outline" size="sm">
                  {isRTL ? "إكمال" : "Compléter"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "views", icon: Eye, label: isRTL ? "المشاهدات" : "Vues", ...mockStats.views },
            { key: "clicks", icon: MousePointer, label: isRTL ? "النقرات" : "Clics", ...mockStats.clicks },
            { key: "calls", icon: Phone, label: isRTL ? "المكالمات" : "Appels", ...mockStats.calls },
            { key: "messages", icon: MessageSquare, label: isRTL ? "الرسائل" : "Messages", ...mockStats.messages },
          ].map((stat) => (
            <Card key={stat.key}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    stat.trend === "up" ? "bg-green-100" : "bg-red-100"
                  )}>
                    <stat.icon className={cn(
                      "w-5 h-5",
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    )} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  )}>
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {stat.change > 0 ? "+" : ""}{stat.change}%
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-foreground">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {isRTL ? "العملاء المحتملون الأخيرون" : "Leads récents"}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? "آخر 4 طلبات" : "Les 4 dernières demandes"}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{mockLeads.filter(l => l.status === "new").length} {isRTL ? "جديد" : "nouveaux"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                    {getLeadIcon(lead.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{lead.name}</span>
                      {getStatusBadge(lead.status)}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Wrench className="w-3 h-3" />
                      {lead.service}
                      <span className="mx-1">•</span>
                      <Clock className="w-3 h-3" />
                      {new Date(lead.date).toLocaleTimeString(isRTL ? "ar-MA" : "fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Arrow className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
              <Link to="/artisan/leads" className="block">
                <Button variant="ghost" className="w-full mt-2">
                  {isRTL ? "عرض الكل" : "Voir tout"}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Service Zones */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {isRTL ? "مناطق التدخل" : "Zones d'intervention"}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? "المدن والأحياء النشطة" : "Villes et quartiers actifs"}
                  </CardDescription>
                </div>
                <Link to="/artisan/zones">
                  <Button variant="outline" size="sm">
                    {isRTL ? "تعديل" : "Modifier"}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockZones.map((zone, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    zone.active ? "bg-background" : "bg-muted/50 opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    zone.active ? "bg-primary/10" : "bg-muted"
                  )}>
                    <MapPin className={cn(
                      "w-5 h-5",
                      zone.active ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{zone.city}</span>
                      {zone.active ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {zone.neighborhoods} {isRTL ? "حي" : "quartiers"}
                    </p>
                  </div>
                  <Badge variant={zone.active ? "default" : "secondary"}>
                    {zone.active ? (isRTL ? "نشط" : "Actif") : (isRTL ? "غير نشط" : "Inactif")}
                  </Badge>
                </div>
              ))}
              <Link to="/artisan/zones" className="block">
                <Button variant="outline" className="w-full mt-2 gap-2">
                  <MapPin className="w-4 h-4" />
                  {isRTL ? "إضافة منطقة" : "Ajouter une zone"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ArtisanLayout>
  );
}
