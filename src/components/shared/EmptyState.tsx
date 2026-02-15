import { cn } from '@/lib/utils';
import { Search, FileQuestion, Wifi, WifiOff, ServerCrash, AlertTriangle, RefreshCw, ArrowLeft, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyVariant = 'no-results' | 'no-data' | 'network-error' | 'server-error' | 'not-found' | 'no-notifications';

interface EmptyStateProps {
  variant: EmptyVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const defaults: Record<EmptyVariant, { icon: React.ReactNode; title: string; description: string }> = {
  'no-results': {
    icon: <Search className="h-12 w-12 text-gray-500" />,
    title: 'Aucun résultat trouvé',
    description: 'Essayez de modifier vos critères de recherche ou d\'élargir vos filtres.',
  },
  'no-data': {
    icon: <Inbox className="h-12 w-12 text-gray-500" />,
    title: 'Aucune donnée',
    description: 'Il n\'y a rien à afficher pour le moment.',
  },
  'network-error': {
    icon: <WifiOff className="h-12 w-12 text-red-400" />,
    title: 'Erreur de connexion',
    description: 'Vérifiez votre connexion internet et réessayez.',
  },
  'server-error': {
    icon: <ServerCrash className="h-12 w-12 text-red-400" />,
    title: 'Erreur serveur',
    description: 'Une erreur inattendue s\'est produite. Veuillez réessayer ultérieurement.',
  },
  'not-found': {
    icon: <FileQuestion className="h-12 w-12 text-gray-500" />,
    title: 'Page introuvable',
    description: 'La page que vous recherchez n\'existe pas ou a été déplacée.',
  },
  'no-notifications': {
    icon: <Inbox className="h-12 w-12 text-gray-500" />,
    title: 'Aucune notification',
    description: 'Vous n\'avez aucune notification pour le moment.',
  },
};

export function EmptyState({ variant, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  const config = defaults[variant];
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="p-4 rounded-full bg-[#1B2F3C] border border-[#2A3F4C] mb-6">
        {config.icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        {title || config.title}
      </h3>
      <p className="text-gray-400 max-w-md mb-6">
        {description || config.description}
      </p>
      {(actionLabel || variant === 'network-error' || variant === 'server-error') && (
        <Button
          onClick={onAction}
          className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white"
        >
          {variant === 'network-error' || variant === 'server-error' ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {actionLabel || 'Réessayer'}
            </>
          ) : variant === 'not-found' ? (
            <>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {actionLabel || 'Retour à l\'accueil'}
            </>
          ) : (
            actionLabel
          )}
        </Button>
      )}
    </div>
  );
}
