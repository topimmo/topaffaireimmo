import { useState, useEffect, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Wrench,
  MapPin,
  Inbox,
  BarChart3,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  ChevronLeft,
  Building2,
  Phone,
  MessageSquare,
  Eye,
  MousePointer,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtisanLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    icon: LayoutDashboard,
    labelFr: "Tableau de bord",
    labelAr: "لوحة التحكم",
    href: "/artisan",
    badge: null,
  },
  {
    icon: User,
    labelFr: "Mon profil",
    labelAr: "ملفي الشخصي",
    href: "/artisan/profile",
    badge: null,
  },
  {
    icon: Wrench,
    labelFr: "Mes services",
    labelAr: "خدماتي",
    href: "/artisan/services",
    badge: null,
  },
  {
    icon: MapPin,
    labelFr: "Zones d'intervention",
    labelAr: "مناطق التدخل",
    href: "/artisan/zones",
    badge: null,
  },
  {
    icon: Inbox,
    labelFr: "Boîte de leads",
    labelAr: "صندوق العملاء المحتملين",
    href: "/artisan/leads",
    badge: 5,
  },
  {
    icon: BarChart3,
    labelFr: "Statistiques",
    labelAr: "الإحصائيات",
    href: "/artisan/stats",
    badge: null,
  },
  {
    icon: Settings,
    labelFr: "Paramètres",
    labelAr: "الإعدادات",
    href: "/artisan/settings",
    badge: null,
  },
];

export default function ArtisanLayout({ children }: ArtisanLayoutProps) {
  const { isRTL } = useLanguage();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  const CollapseChevron = sidebarCollapsed 
    ? (isRTL ? ChevronLeft : ChevronRight)
    : (isRTL ? ChevronRight : ChevronLeft);

  return (
    <div className={cn("min-h-screen bg-muted/30", isRTL && "rtl")}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-50 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <Link to="/" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-display font-semibold">
            TopAffaire<span className="text-primary">Immo</span>
          </span>
        </Link>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
            3
          </span>
        </Button>
      </header>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 h-full bg-background border-r z-50 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-20" : "w-72",
          isRTL ? "right-0 border-l border-r-0" : "left-0",
          // Mobile
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              <span className="font-display font-semibold">
                TopAffaire<span className="text-primary">Immo</span>
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/" className="mx-auto">
              <Building2 className="h-7 w-7 text-primary" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {user?.user_metadata?.full_name || "Artisan"}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  <Wrench className="w-3 h-3 mr-1" />
                  {isRTL ? "حرفي" : "Artisan"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", sidebarCollapsed && "mx-auto")} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">
                        {isRTL ? item.labelAr : item.labelFr}
                      </span>
                      {item.badge && (
                        <Badge
                          variant={isActive ? "secondary" : "default"}
                          className="h-5 min-w-[20px] px-1.5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-foreground",
              sidebarCollapsed && "justify-center"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && (
              <span className="ml-3 text-sm">{isRTL ? "تسجيل الخروج" : "Déconnexion"}</span>
            )}
          </Button>
        </div>

        {/* Collapse Toggle (desktop only) */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "hidden lg:flex absolute top-20 -right-3 w-6 h-6 rounded-full border bg-background shadow-sm",
            isRTL && "-left-3 right-auto"
          )}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <CollapseChevron className="w-3 h-3" />
        </Button>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300 pt-16 lg:pt-0",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-72",
          isRTL && (sidebarCollapsed ? "lg:pr-20 lg:pl-0" : "lg:pr-72 lg:pl-0")
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around z-40">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">
                {isRTL ? item.labelAr.split(" ")[0] : item.labelFr.split(" ")[0]}
              </span>
              {item.badge && (
                <span className="absolute -top-1 right-0 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
