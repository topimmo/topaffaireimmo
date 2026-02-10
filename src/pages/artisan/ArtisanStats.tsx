import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ArtisanLayout from "@/components/layout/ArtisanLayout";
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
  Eye,
  MousePointer,
  Phone,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock chart data
const mockDailyStats = [
  { day: "Lun", views: 156, clicks: 42, calls: 5 },
  { day: "Mar", views: 189, clicks: 51, calls: 7 },
  { day: "Mer", views: 134, clicks: 38, calls: 3 },
  { day: "Jeu", views: 210, clicks: 62, calls: 8 },
  { day: "Ven", views: 178, clicks: 48, calls: 6 },
  { day: "Sam", views: 245, clicks: 71, calls: 9 },
  { day: "Dim", views: 135, clicks: 30, calls: 2 },
];

const mockServiceStats = [
  { service: "Plomberie", views: 520, percentage: 45 },
  { service: "Électricité", views: 340, percentage: 30 },
  { service: "Peinture", views: 180, percentage: 15 },
  { service: "Climatisation", views: 107, percentage: 10 },
];

const mockLocationStats = [
  { location: "Casablanca - Maarif", leads: 12 },
  { location: "Casablanca - Anfa", leads: 8 },
  { location: "Rabat - Agdal", leads: 5 },
  { location: "Casablanca - Bourgogne", leads: 3 },
];

export default function ArtisanStats() {
  const { isRTL } = useLanguage();
  const [period, setPeriod] = useState("7");

  const stats = {
    views: { value: 1247, change: 12.5, trend: "up" as const },
    clicks: { value: 342, change: 8.2, trend: "up" as const },
    calls: { value: 28, change: -3.1, trend: "down" as const },
    messages: { value: 45, change: 15.7, trend: "up" as const },
  };

  const maxViews = Math.max(...mockDailyStats.map((d) => d.views));

  return (
    <ArtisanLayout>
      <div className="p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">
              {isRTL ? "الإحصائيات" : "Statistiques"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL
                ? "تتبع أداء ملفك الشخصي"
                : "Suivez les performances de votre profil"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{isRTL ? "7 أيام" : "7 jours"}</SelectItem>
                <SelectItem value="30">{isRTL ? "30 يوم" : "30 jours"}</SelectItem>
                <SelectItem value="90">{isRTL ? "90 يوم" : "90 jours"}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? "تصدير" : "Exporter"}</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "views", icon: Eye, label: isRTL ? "المشاهدات" : "Vues", ...stats.views, color: "blue" },
            { key: "clicks", icon: MousePointer, label: isRTL ? "النقرات" : "Clics", ...stats.clicks, color: "purple" },
            { key: "calls", icon: Phone, label: isRTL ? "المكالمات" : "Appels", ...stats.calls, color: "green" },
            { key: "messages", icon: MessageSquare, label: isRTL ? "الرسائل" : "Messages", ...stats.messages, color: "orange" },
          ].map((stat) => (
            <Card key={stat.key}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      stat.color === "blue" && "bg-blue-100",
                      stat.color === "purple" && "bg-purple-100",
                      stat.color === "green" && "bg-green-100",
                      stat.color === "orange" && "bg-orange-100"
                    )}
                  >
                    <stat.icon
                      className={cn(
                        "w-5 h-5",
                        stat.color === "blue" && "text-blue-600",
                        stat.color === "purple" && "text-purple-600",
                        stat.color === "green" && "text-green-600",
                        stat.color === "orange" && "text-orange-600"
                      )}
                    />
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {stat.change > 0 ? "+" : ""}
                    {stat.change}%
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
          {/* Daily Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {isRTL ? "النشاط اليومي" : "Activité quotidienne"}
                  </CardTitle>
                  <CardDescription>
                    {isRTL
                      ? "المشاهدات والنقرات خلال الأسبوع"
                      : "Vues et clics au cours de la semaine"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Simple Bar Chart */}
              <div className="space-y-4">
                <div className="flex items-end justify-between h-[200px] gap-2 pt-4">
                  {mockDailyStats.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center gap-1">
                        {/* Views bar */}
                        <div
                          className="w-full bg-primary/20 rounded-t transition-all"
                          style={{ height: `${(day.views / maxViews) * 150}px` }}
                        >
                          <div
                            className="w-full bg-primary rounded-t"
                            style={{ height: `${(day.clicks / day.views) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{day.day}</span>
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary/20" />
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? "المشاهدات" : "Vues"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? "النقرات" : "Clics"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                {isRTL ? "أداء الخدمات" : "Performance par service"}
              </CardTitle>
              <CardDescription>
                {isRTL
                  ? "توزيع المشاهدات حسب الخدمة"
                  : "Répartition des vues par service"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockServiceStats.map((service, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{service.service}</span>
                    <span className="text-sm text-muted-foreground">
                      {service.views} {isRTL ? "مشاهدة" : "vues"}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        index === 0 && "bg-primary",
                        index === 1 && "bg-secondary",
                        index === 2 && "bg-blue-500",
                        index === 3 && "bg-orange-500"
                      )}
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Location Performance */}
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? "أفضل المناطق" : "Top localisations"}</CardTitle>
            <CardDescription>
              {isRTL
                ? "المناطق التي تحقق أكبر عدد من العملاء المحتملين"
                : "Les zones qui génèrent le plus de leads"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockLocationStats.map((location, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{location.location}</p>
                    <p className="text-sm text-muted-foreground">
                      {location.leads} {isRTL ? "عملاء" : "leads"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-2">27.4%</div>
              <p className="text-sm font-medium">
                {isRTL ? "معدل النقر" : "Taux de clic"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL ? "نقرات / مشاهدات" : "Clics / Vues"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-secondary mb-2">8.2%</div>
              <p className="text-sm font-medium">
                {isRTL ? "معدل التحويل" : "Taux de conversion"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL ? "مكالمات / نقرات" : "Appels / Clics"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">2.1</div>
              <p className="text-sm font-medium">
                {isRTL ? "متوسط العملاء/يوم" : "Leads/jour moyen"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL ? "خلال الفترة المحددة" : "Sur la période sélectionnée"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ArtisanLayout>
  );
}
