import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Building2, 
  LayoutDashboard, 
  FileText, 
  Users, 
  LogOut, 
  Bell,
  Building,
  MapPin,
  Settings,
  Activity,
  BookOpen,
  FolderTree,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { t, isRTL } = useLanguage();
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const { notifications, unreadCount, refresh } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: isRTL ? 'لوحة التحكم' : 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: location.pathname === '/admin' || location.pathname === '/admin/dashboard',
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
    {
      name: isRTL ? 'الوكالات' : 'Agencies',
      href: '/admin/agencies',
      icon: Building,
      current: location.pathname === '/admin/agencies',
    },
    {
      name: isRTL ? 'المواقع' : 'Locations',
      href: '/admin/locations',
      icon: MapPin,
      current: location.pathname === '/admin/locations',
    },
    {
      name: isRTL ? 'المحتوى' : 'Content',
      href: '/admin/content/pages',
      icon: BookOpen,
      current: location.pathname.startsWith('/admin/content'),
    },
    {
      name: isRTL ? 'الإعدادات' : 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname === '/admin/settings',
    },
    {
      name: isRTL ? 'التشخيص' : 'Diagnostics',
      href: '/admin/diagnostics',
      icon: Activity,
      current: location.pathname === '/admin/diagnostics',
    },
  ];

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleNotificationClick = async (notificationId: string, link?: string | null) => {
    await markNotificationAsRead(notificationId);
    refresh();
    if (link) {
      window.location.href = link;
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    refresh();
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

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="font-semibold text-sm">
                    {isRTL ? 'الإشعارات' : 'Notifications'}
                  </span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-auto py-1"
                    >
                      {isRTL ? 'تحديد الكل كمقروء' : 'Mark all read'}
                    </Button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {isRTL ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id, notification.link)}
                      className="cursor-pointer flex-col items-start p-3 border-b last:border-b-0"
                    >
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {notification.body}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile?.email}
            </span>
            
            {/* Mobile menu toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex">
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

        {/* Mobile Navigation - Collapsible Sidebar */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className={cn(
                "fixed top-16 bottom-0 w-64 bg-white shadow-xl overflow-y-auto",
                isRTL ? "right-0" : "left-0"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="px-2 pt-4 pb-20 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        item.current
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-gray-100',
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                      )}
                    >
                      <Icon
                        className={cn(
                          item.current ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                          `${isRTL ? 'ml-3' : 'mr-3'} flex-shrink-0 h-5 w-5`
                        )}
                      />
                      {item.name}
                    </Link>
                  );
                })}
                
                {/* Logout button for mobile */}
                <Button 
                  variant="ghost" 
                  className="w-full justify-start mt-4" 
                  onClick={handleLogout}
                >
                  <LogOut className={cn("h-5 w-5", isRTL ? "ml-3" : "mr-3")} />
                  {isRTL ? 'تسجيل الخروج' : 'Logout'}
                </Button>
              </nav>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation - Quick Access */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <nav className="flex justify-around">
            {navigation.slice(0, 4).map((item) => {
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
