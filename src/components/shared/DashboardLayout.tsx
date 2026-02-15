import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  id: string;
  badge?: number;
}

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  sidebarItems: SidebarItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
  children: React.ReactNode;
  userAvatar?: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export function DashboardLayout({
  title,
  sidebarItems,
  activeItem,
  onItemChange,
  children,
  userAvatar,
  userName = 'Utilisateur',
  userRole = 'Membre',
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-[#2A3F4C]">
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0FC2C0] to-[#0A9D9B] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          {(!collapsed || mobile) && (
            <span className="font-bold text-lg text-white">
              TopAffaire<span className="text-[#0FC2C0]">Immo</span>
            </span>
          )}
        </Link>
      </div>

      {/* User Section */}
      <div className={cn(
        'p-4 border-b border-[#2A3F4C]',
        collapsed && !mobile ? 'flex justify-center' : ''
      )}>
        <div className={cn('flex items-center gap-3', collapsed && !mobile ? 'flex-col' : '')}>
          {userAvatar || (
            <div className="w-10 h-10 rounded-full bg-[#0FC2C0] flex items-center justify-center text-white font-bold flex-shrink-0">
              {userName.charAt(0)}
            </div>
          )}
          {(!collapsed || mobile) && (
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{userName}</p>
              <p className="text-xs text-gray-400 truncate">{userRole}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                activeItem === item.id
                  ? 'bg-[#0FC2C0]/15 text-[#0FC2C0] font-medium'
                  : 'text-gray-400 hover:bg-[#1B2F3C] hover:text-white',
                collapsed && !mobile ? 'justify-center px-2' : ''
              )}
              title={collapsed && !mobile ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {(!collapsed || mobile) && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-[#0FC2C0] text-[#0A1F2E] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-[#2A3F4C]">
        <button className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all',
          collapsed && !mobile ? 'justify-center px-2' : ''
        )}>
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A1F2E] flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col border-r border-[#2A3F4C] bg-[#0D1E2B] transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-[calc(theme(width.64)-12px)] top-20 z-10 hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-[#2A3F4C] border border-[#3A4F5C] text-gray-400 hover:text-white hover:bg-[#0FC2C0] transition-all"
          style={{ left: collapsed ? '60px' : '244px' }}
        >
          <ChevronLeft className={cn('h-3 w-3 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 border-b border-[#2A3F4C] bg-[#0A1F2E]/95 backdrop-blur flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-gray-400 hover:text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-[#0D1E2B] border-[#2A3F4C] p-0">
                <SidebarContent mobile />
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-lg font-bold text-white">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs">
                ← Retour au site
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
