import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, LayoutDashboard, FileText, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { t, isRTL } = useLanguage();
  const { signOut, profile } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: isRTL ? 'لوحة التحكم' : 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: location.pathname === '/admin',
    },
    {
      name: isRTL ? 'الإعلانات' : 'Listings',
      href: '/admin/listings',
      icon: FileText,
      current: location.pathname.startsWith('/admin/listings'),
    },
    {
      name: isRTL ? 'المستخدمون' : 'Users',
      href: '/admin/users',
      icon: Users,
      current: location.pathname === '/admin/users',
    },
  ];

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-semibold">
                TopAffaire<span className="text-primary">Immo</span>
              </span>
            </Link>
            <div className="hidden sm:block">
              <span className="text-sm text-muted-foreground px-3 py-1 bg-primary/10 rounded-full">
                {isRTL ? 'مدير' : 'Admin'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              {isRTL ? 'تسجيل الخروج' : 'Logout'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        item.current
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-gray-100',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                      )}
                    >
                      <Icon
                        className={cn(
                          item.current ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                          `${isRTL ? 'ml-3' : 'mr-3'} flex-shrink-0 h-5 w-5`
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <nav className="flex justify-around">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    item.current
                      ? 'text-primary'
                      : 'text-muted-foreground',
                    'flex flex-col items-center py-2 px-3 text-xs'
                  )}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:pl-64">
          <div className="py-6 px-4 sm:px-6 lg:px-8 pb-20 md:pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
