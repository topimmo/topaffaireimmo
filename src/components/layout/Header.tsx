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
import {
  Menu,
  X,
  Plus,
  Building2,
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  UserPlus,
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
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        isScrolled

            TopAffaire<span className="text-primary">Immo</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/buy"

        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>

                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-xl border-2">
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

                <Link to="/register">
                  <Plus className="h-4 w-4" />
                  {isRTL ? 'نشر إعلان' : 'Publier une annonce'}
                </Link>
              </Button>
              <Button size="sm" asChild className="shadow-md hover:shadow-lg">
                <Link to="/artisan/onboarding">
                  <UserPlus className="h-4 w-4" />
                  {isRTL ? 'أصبح مزود خدمة' : 'Devenir prestataire'}
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-3">
          <LanguageSwitcher />
          <button
            className="p-2 hover:bg-muted rounded-lg transition-all duration-300"
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

            <Link
              to="/buy"
              className="text-sm font-semibold py-2 hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >

            </Link>
            <Link
              to="/services"
              className="text-sm font-semibold py-2 hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.services')}
            </Link>
            {user ? (
              <>
                <>
                  <Link
                      to="/dashboard"
                      className="text-sm font-semibold py-2 hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <Button asChild className="mt-2 shadow-md hover:shadow-lg font-semibold">
                      <Link to="/add-listing" onClick={() => setIsMobileMenuOpen(false)}>
                        <Plus className="h-4 w-4" />
                        {t('nav.addListing')}
                      </Link>
                    </Button>
                  </>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm font-semibold py-2 hover:text-primary transition-colors"
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
                  className="mt-2 shadow-md hover:shadow-lg font-semibold"
                >
                  <LogOut className="h-4 w-4" />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="mt-2 shadow-md hover:shadow-lg font-semibold">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.login')}
                  </Link>
                </Button>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Plus className="h-4 w-4" />
                    {isRTL ? 'نشر إعلان' : 'Publier une annonce'}
                  </Link>
                </Button>
                <Button asChild className="mt-2">
                  <Link to="/artisan/onboarding" onClick={() => setIsMobileMenuOpen(false)}>
                    <UserPlus className="h-4 w-4" />
                    {isRTL ? 'أصبح مزود خدمة' : 'Devenir prestataire'}
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
