import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Bell, Check, CheckCheck, Home, User, Star, AlertTriangle, MessageSquare, X, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'lead' | 'approval' | 'review' | 'system' | 'message';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'lead', title: 'Nouvelle demande de contact', description: 'Un acheteur a demandé vos coordonnées pour l\'appartement à Casablanca', time: 'Il y a 5 min', read: false },
  { id: '2', type: 'approval', title: 'Annonce approuvée', description: 'Votre annonce "Villa de luxe Marrakech" a été approuvée et est maintenant en ligne', time: 'Il y a 2h', read: false },
  { id: '3', type: 'review', title: 'Nouvel avis reçu', description: 'Un client vous a donné 5 étoiles !', time: 'Il y a 4h', read: false },
  { id: '4', type: 'system', title: 'Boost expiré', description: 'Le boost de votre annonce a expiré. Renouvelez pour maintenir la visibilité.', time: 'Il y a 1 jour', read: true },
  { id: '5', type: 'message', title: 'Nouveau message', description: 'Mohamed A. vous a envoyé un message', time: 'Il y a 2 jours', read: true },
];

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  lead: { icon: <User className="h-4 w-4" />, color: 'bg-blue-500/20 text-blue-400' },
  approval: { icon: <Check className="h-4 w-4" />, color: 'bg-green-500/20 text-green-400' },
  review: { icon: <Star className="h-4 w-4" />, color: 'bg-amber-500/20 text-amber-400' },
  system: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-500/20 text-red-400' },
  message: { icon: <MessageSquare className="h-4 w-4" />, color: 'bg-[#0FC2C0]/20 text-[#0FC2C0]' },
};

interface NotificationBellProps {
  count?: number;
  className?: string;
}

export function NotificationBell({ count = 3, className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative text-gray-300 hover:text-[#0FC2C0] hover:bg-[#1B2F3C]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-[#0FC2C0] text-[#0A1F2E] text-xs font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 md:w-96 bg-[#1B2F3C] border border-[#2A3F4C] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2A3F4C]">
              <h3 className="font-bold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-[#0FC2C0] hover:text-[#0FC2C0] hover:bg-[#0FC2C0]/10 h-7">
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Tout lire
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-7 w-7 text-gray-400 hover:text-white">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Inbox className="h-10 w-10 text-gray-500 mb-3" />
                  <p className="text-sm text-gray-400">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2A3F4C]">
                  {notifications.map((notification) => {
                    const config = typeConfig[notification.type];
                    return (
                      <button
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={cn(
                          'w-full flex gap-3 p-4 text-left hover:bg-[#0A1F2E] transition-colors',
                          !notification.read && 'bg-[#0FC2C0]/5'
                        )}
                      >
                        <div className={cn('p-2 rounded-lg flex-shrink-0', config.color)}>
                          {config.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm font-medium line-clamp-1',
                              notification.read ? 'text-gray-300' : 'text-white'
                            )}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-[#0FC2C0] flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{notification.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-[#2A3F4C]">
              <Button variant="ghost" className="w-full text-sm text-[#0FC2C0] hover:text-[#0FC2C0] hover:bg-[#0FC2C0]/10">
                Voir toutes les notifications
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
