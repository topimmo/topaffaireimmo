import { Bell, Menu, Search, User, Home, Wrench, LayoutDashboard, LogIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationBell } from '@/components/shared/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Header() {
  const [isAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/properties', label: 'Propriétés', icon: <Home className="h-4 w-4" /> },
    { to: '/artisans', label: 'Artisans', icon: <Wrench className="h-4 w-4" /> },
  ];

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b bg-[#0A1F2E]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A1F2E]/80 transition-all duration-300',
      scrolled && 'shadow-lg border-[#1B2F3C]'
    )}>
      <div className={cn(
        'container mx-auto flex items-center justify-between px-4 md:px-8 transition-all duration-300',
        scrolled ? 'h-14' : 'h-16'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0FC2C0] to-[#0A9D9B] flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className={cn(
              'font-bold text-xl text-white transition-all',
              scrolled ? 'hidden lg:inline-block' : 'hidden md:inline-block'
            )}>
              TopAffaire<span className="text-[#0FC2C0]">Immo</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'text-sm font-medium transition-colors',
                  location.pathname === link.to ? 'text-[#0FC2C0]' : 'text-gray-300 hover:text-[#0FC2C0]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Search - Desktop */}
          <Button variant="ghost" size="icon" className="hidden md:flex text-gray-300 hover:text-[#0FC2C0] hover:bg-[#1B2F3C]">
            <Search className="h-5 w-5" />
          </Button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Menu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[#0FC2C0] hover:bg-[#1B2F3C]">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1B2F3C] border-[#2A3F4C]">
                <DropdownMenuLabel className="text-white">Mon Compte</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#2A3F4C]" />
                <Link to="/dashboard/advertiser">
                  <DropdownMenuItem className="text-gray-300 focus:bg-[#0A1F2E] focus:text-white cursor-pointer">
                    Tableau de bord
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="text-gray-300 focus:bg-[#0A1F2E] focus:text-white">
                  Mes annonces
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 focus:bg-[#0A1F2E] focus:text-white">
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2A3F4C]" />
                <DropdownMenuItem className="text-gray-300 focus:bg-[#0A1F2E] focus:text-white">
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-[#1B2F3C]">
                  Connexion
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-medium">
                  Publier une annonce
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-gray-300 hover:text-[#0FC2C0] hover:bg-[#1B2F3C]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[#0D1E2B] border-[#2A3F4C] p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="p-4 border-b border-[#2A3F4C]">
                  <Link to="/" className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0FC2C0] to-[#0A9D9B] flex items-center justify-center">
                      <span className="text-white font-bold text-lg">T</span>
                    </div>
                    <span className="font-bold text-lg text-white">
                      TopAffaire<span className="text-[#0FC2C0]">Immo</span>
                    </span>
                  </Link>
                </div>

                {/* Mobile Nav */}
                <nav className="flex-1 p-4 space-y-1">
                  {navLinks.map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all',
                        location.pathname === link.to
                          ? 'bg-[#0FC2C0]/15 text-[#0FC2C0] font-medium'
                          : 'text-gray-400 hover:bg-[#1B2F3C] hover:text-white'
                      )}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                  <div className="h-px bg-[#2A3F4C] my-4" />
                  <p className="px-3 text-xs text-gray-500 uppercase tracking-wider mb-2">Tableaux de bord</p>
                  <Link to="/dashboard/advertiser" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-400 hover:bg-[#1B2F3C] hover:text-white">
                    <LayoutDashboard className="h-4 w-4" />Espace annonceur
                  </Link>
                  <Link to="/dashboard/artisan" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-400 hover:bg-[#1B2F3C] hover:text-white">
                    <Wrench className="h-4 w-4" />Espace artisan
                  </Link>
                  <Link to="/dashboard/admin" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-400 hover:bg-[#1B2F3C] hover:text-white">
                    <User className="h-4 w-4" />Administration
                  </Link>
                </nav>

                {/* Mobile Auth */}
                <div className="p-4 border-t border-[#2A3F4C] space-y-2">
                  <Link to="/login" className="block">
                    <Button variant="outline" className="w-full border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C] hover:text-white">
                      <LogIn className="h-4 w-4 mr-2" />Connexion
                    </Button>
                  </Link>
                  <Link to="/register" className="block">
                    <Button className="w-full bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
                      Publier une annonce
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
