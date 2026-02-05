import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageSwitcher from "./LanguageSwitcher";
import { InstallPWAButton } from "@/components/pwa/InstallPWAButton";
import {
  Menu,
  X,
  Plus,
  Building2,
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const { t, isRTL } = useLanguage();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
        isScrolled
          ? "h-16 bg-background/95 backdrop-blur-md shadow-sm"
          : "h-20 bg-transparent",
        isRTL ? "rtl" : "ltr"
      )}
    >
      <div className="container h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="font-display text-xl font-semibold text-foreground">
            TopAffaire<span className="text-primary">Immo</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/buy"
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            {t('nav.buy')}
          </Link>
          <Link
            to="/rent"
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            {t('nav.rent')}
          </Link>
          <Link
            to="/agencies"
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            {t('nav.agencies')}
          </Link>
          <Link
            to="/advertise"
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            {t('nav.advertise')}
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <InstallPWAButton />
          <LanguageSwitcher />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <>
                  <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        {t('nav.dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/add-listing" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {t('nav.addListing')}
                      </Link>
                    </DropdownMenuItem>
                  </>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      {t('admin.title')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">{t('nav.login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">
                  <Plus className="h-4 w-4" />
                  {isRTL ? 'نشر إعلان مجاني' : 'Publier gratuitement'}
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <InstallPWAButton />
          <LanguageSwitcher />
          <button
            className="p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg">
          <nav className="container py-4 flex flex-col gap-4">
            <Link
              to="/buy"
              className="text-sm font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.buy')}
            </Link>
            <Link
              to="/rent"
              className="text-sm font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.rent')}
            </Link>
            <Link
              to="/agencies"
              className="text-sm font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.agencies')}
            </Link>
            <Link
              to="/advertise"
              className="text-sm font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.advertise')}
            </Link>
            {user ? (
              <>
                <>
                  <Link
                      to="/dashboard"
                      className="text-sm font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <Button asChild className="mt-2">
                      <Link to="/add-listing" onClick={() => setIsMobileMenuOpen(false)}>
                        <Plus className="h-4 w-4" />
                        {t('nav.addListing')}
                      </Link>
                    </Button>
                  </>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('admin.title')}
                  </Link>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="mt-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.login')}
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Plus className="h-4 w-4" />
                    {t('nav.register')}
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
