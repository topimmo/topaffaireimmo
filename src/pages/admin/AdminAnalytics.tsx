import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Eye,
  Phone,
  MessageSquare,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for analytics
const mockAnalytics = {
  overview: {
    totalViews: 45210,
    viewsChange: 12.5,
    totalLeads: 1247,
    leadsChange: 8.3,
    totalUsers: 3421,
    usersChange: 15.2,
    totalListings: 892,
    listingsChange: 5.7,
  },
  dailyViews: [
    { day: "Lun", views: 5200, leads: 145 },
    { day: "Mar", views: 6100, leads: 178 },
    { day: "Mer", views: 4800, leads: 132 },
    { day: "Jeu", views: 7200, leads: 201 },
    { day: "Ven", views: 6800, leads: 189 },
    { day: "Sam", views: 8100, leads: 234 },
    { day: "Dim", views: 7010, leads: 168 },
  ],
  topCities: [
    { name: "Casablanca", views: 15420, percentage: 34 },
    { name: "Rabat", views: 9870, percentage: 22 },
    { name: "Marrakech", views: 7650, percentage: 17 },
    { name: "Tanger", views: 5430, percentage: 12 },
    { name: "Agadir", views: 3890, percentage: 8.6 },
  ],
  topPropertyTypes: [
    { type: "Appartement", count: 423, percentage: 47 },
    { type: "Villa", count: 187, percentage: 21 },
    { type: "Maison", count: 156, percentage: 17 },
    { type: "Commercial", count: 89, percentage: 10 },
    { type: "Terrain", count: 37, percentage: 4 },
  ],
  conversionFunnel: [
    { stage: "Vues", count: 45210, percentage: 100 },
    { stage: "Clics", count: 12340, percentage: 27 },
    { stage: "Contacts", count: 3456, percentage: 7.6 },
    { stage: "Leads", count: 1247, percentage: 2.8 },
  ],
};

export default function AdminAnalytics() {
  const { isRTL } = useLanguage();
  const [period, setPeriod] = useState("7");
  const [loading, setLoading] = useState(false);

  const maxViews = Math.max(...mockAnalytics.dailyViews.map((d) => d.views));

  const statCards = [
    {
      title: isRTL ? "إجمالي المشاهدات" : "Total Views",
      value: mockAnalytics.overview.totalViews,
      change: mockAnalytics.overview.viewsChange,
      icon: Eye,
      color: "blue",
    },
    {
      title: isRTL ? "العملاء المحتملون" : "Total Leads",
      value: mockAnalytics.overview.totalLeads,
      change: mockAnalytics.overview.leadsChange,
      icon: Phone,
      color: "green",
    },
    {
      title: isRTL ? "المستخدمون" : "Total Users",
      value: mockAnalytics.overview.totalUsers,
      change: mockAnalytics.overview.usersChange,
      icon: Users,
      color: "purple",
    },
    {
      title: isRTL ? "الإعلانات" : "Total Listings",
      value: mockAnalytics.overview.totalListings,
      change: mockAnalytics.overview.listingsChange,
      icon: Building2,
      color: "orange",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {isRTL ? "التحليلات" : "Analytics"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL
                ? "نظرة شاملة على أداء المنصة"
                : "Vue d'ensemble des performances de la plateforme"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{isRTL ? "7 أيام" : "7 jours"}</SelectItem>
                <SelectItem value="30">{isRTL ? "30 يوم" : "30 jours"}</SelectItem>
                <SelectItem value="90">{isRTL ? "90 يوم" : "90 jours"}</SelectItem>
                <SelectItem value="365">{isRTL ? "سنة" : "1 an"}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              {isRTL ? "تصدير" : "Export"}
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      stat.color === "blue" && "bg-blue-100",
                      stat.color === "green" && "bg-green-100",
                      stat.color === "purple" && "bg-purple-100",
                      stat.color === "orange" && "bg-orange-100"
                    )}
                  >
                    <stat.icon
                      className={cn(
                        "w-5 h-5",
                        stat.color === "blue" && "text-blue-600",
                        stat.color === "green" && "text-green-600",
                        stat.color === "purple" && "text-purple-600",
                        stat.color === "orange" && "text-orange-600"
                      )}
                    />
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      stat.change >= 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.change > 0 ? "+" : ""}
                    {stat.change}%
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-foreground">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Views Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {isRTL ? "المشاهدات والعملاء" : "Views & Leads"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "على مدار الأسبوع الماضي" : "Sur les 7 derniers jours"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end justify-between h-[200px] gap-2">
                  {mockAnalytics.dailyViews.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-blue-200 rounded-t transition-all relative"
                          style={{ height: `${(day.views / maxViews) * 160}px` }}
                        >
                          <div
                            className="absolute bottom-0 w-full bg-primary rounded-t"
                            style={{ height: `${(day.leads / day.views) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{day.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-200" />
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? "المشاهدات" : "Vues"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? "العملاء" : "Leads"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {isRTL ? "قمع التحويل" : "Conversion Funnel"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "من المشاهدة إلى العميل" : "De la vue au lead"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAnalytics.conversionFunnel.map((stage, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <span className="text-sm text-muted-foreground">
                      {stage.count.toLocaleString()} ({stage.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        index === 0 && "bg-blue-500",
                        index === 1 && "bg-green-500",
                        index === 2 && "bg-yellow-500",
                        index === 3 && "bg-primary"
                      )}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Cities */}
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? "أفضل المدن" : "Top Cities"}</CardTitle>
              <CardDescription>
                {isRTL ? "حسب عدد المشاهدات" : "Par nombre de vues"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAnalytics.topCities.map((city, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{city.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {city.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${city.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Property Types */}
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? "أنواع العقارات" : "Property Types"}</CardTitle>
              <CardDescription>
                {isRTL ? "توزيع الإعلانات حسب النوع" : "Distribution par type de bien"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAnalytics.topPropertyTypes.map((type, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      index === 0 && "bg-blue-100",
                      index === 1 && "bg-green-100",
                      index === 2 && "bg-yellow-100",
                      index === 3 && "bg-purple-100",
                      index === 4 && "bg-orange-100"
                    )}
                  >
                    <Building2
                      className={cn(
                        "w-4 h-4",
                        index === 0 && "text-blue-600",
                        index === 1 && "text-green-600",
                        index === 2 && "text-yellow-600",
                        index === 3 && "text-purple-600",
                        index === 4 && "text-orange-600"
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{type.type}</span>
                      <span className="text-sm text-muted-foreground">
                        {type.count} ({type.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          index === 0 && "bg-blue-500",
                          index === 1 && "bg-green-500",
                          index === 2 && "bg-yellow-500",
                          index === 3 && "bg-purple-500",
                          index === 4 && "bg-orange-500"
                        )}
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
