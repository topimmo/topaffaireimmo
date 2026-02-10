import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import AdvertiserLayout from "@/components/layout/AdvertiserLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Eye,
  Phone,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Rocket,
  Plus,
  MapPin,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const mockStats = {
  totalListings: 12,
  activeListings: 8,
  views: 4521,
  viewsChange: 15.3,
  leads: 47,
  leadsChange: 8.7,
};

const mockListings = [
  {
    id: "1",
    title: "Appartement 3 chambres - Maarif",
    price: 1500000,
    type: "apartment",
    transaction: "sale",
    status: "published",
    views: 234,
    leads: 5,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80",
  },
  {
    id: "2",
    title: "Villa moderne avec piscine - Anfa",
    price: 4500000,
    type: "villa",
    transaction: "sale",
    status: "published",
    views: 456,
    leads: 12,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
    boosted: true,
  },
  {
    id: "3",
    title: "Bureau 100m² - Centre ville",
    price: 12000,
    type: "commercial",
    transaction: "rent",
    status: "pending",
    views: 89,
    leads: 2,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
  },
];

const mockRecentLeads = [
  { id: "1", name: "Ahmed B.", listing: "Appartement 3 chambres", date: "2024-01-15", type: "call" },
  { id: "2", name: "Fatima M.", listing: "Villa moderne", date: "2024-01-15", type: "whatsapp" },
  { id: "3", name: "Youssef K.", listing: "Bureau 100m²", date: "2024-01-14", type: "message" },
];

export default function AdvertiserDashboard() {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-700">{isRTL ? "منشور" : "Publié"}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">{isRTL ? "قيد المراجعة" : "En attente"}</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-700">{isRTL ? "مسودة" : "Brouillon"}</Badge>;
      default:
        return null;
    }
  };

  return (
    <AdvertiserLayout>
      <div className="p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">
              {isRTL ? "مرحباً،" : "Bonjour,"}{" "}
              {user?.user_metadata?.full_name?.split(" ")[0] || "Annonceur"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL
                ? "إليك ملخص أداء إعلاناتك"
                : "Voici le résumé de vos performances"}
            </p>
          </div>
          <Link to="/add-listing">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? "إضافة إعلان" : "Nouvelle annonce"}
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-foreground">
                {mockStats.activeListings}/{mockStats.totalListings}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? "إعلانات نشطة" : "Annonces actives"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="w-4 h-4" />+{mockStats.viewsChange}%
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-foreground">
                {mockStats.views.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? "مشاهدات هذا الشهر" : "Vues ce mois"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="w-4 h-4" />+{mockStats.leadsChange}%
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-foreground">
                {mockStats.leads}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? "عملاء محتملون" : "Leads reçus"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">
                {isRTL ? "عزز إعلاناتك" : "Boostez vos annonces"}
              </p>
              <Link to="/advertiser/boost">
                <Button variant="link" className="p-0 h-auto text-primary gap-1">
                  {isRTL ? "اكتشف" : "Découvrir"}
                  <Arrow className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Listings Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {isRTL ? "إعلاناتك الأخيرة" : "Vos annonces récentes"}
              </h2>
              <Link to="/advertiser/listings">
                <Button variant="ghost" size="sm" className="gap-1">
                  {isRTL ? "عرض الكل" : "Voir tout"}
                  <Arrow className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {mockListings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      {listing.boosted && (
                        <div className="absolute top-1 left-1">
                          <Badge className="bg-primary text-xs px-1.5">
                            <Rocket className="w-3 h-3" />
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-1">
                            {listing.title}
                          </h3>
                          <p className="text-lg font-bold text-primary mt-1">
                            {listing.price.toLocaleString()} {listing.transaction === "rent" ? "DH/mois" : "DH"}
                          </p>
                        </div>
                        {getStatusBadge(listing.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {listing.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {listing.leads} {isRTL ? "عملاء" : "leads"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Leads */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {isRTL ? "آخر العملاء" : "Derniers leads"}
                  </CardTitle>
                  <Badge variant="secondary">{mockRecentLeads.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockRecentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                      {lead.type === "call" ? (
                        <Phone className="w-4 h-4 text-green-600" />
                      ) : lead.type === "whatsapp" ? (
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.listing}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(lead.date).toLocaleDateString(isRTL ? "ar-MA" : "fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                ))}
                <Link to="/advertiser/leads" className="block">
                  <Button variant="outline" className="w-full">
                    {isRTL ? "عرض جميع العملاء" : "Voir tous les leads"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {isRTL ? "إجراءات سريعة" : "Actions rapides"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/add-listing" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="w-4 h-4" />
                    {isRTL ? "إضافة إعلان" : "Ajouter une annonce"}
                  </Button>
                </Link>
                <Link to="/advertiser/media" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Image className="w-4 h-4" />
                    {isRTL ? "إدارة الصور" : "Gérer les médias"}
                  </Button>
                </Link>
                <Link to="/advertiser/boost" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Rocket className="w-4 h-4" />
                    {isRTL ? "تعزيز إعلان" : "Booster une annonce"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdvertiserLayout>
  );
}
