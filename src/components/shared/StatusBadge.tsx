import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StatusType = 'draft' | 'pending' | 'approved' | 'published' | 'rejected' | 'expired';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  pending: { label: 'En attente', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  approved: { label: 'Approuvé', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  published: { label: 'Publié', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  rejected: { label: 'Rejeté', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  expired: { label: 'Expiré', className: 'bg-gray-500/20 text-gray-500 border-gray-500/30' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge className={cn('text-xs font-medium', config.className, className)}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        status === 'draft' && 'bg-gray-400',
        status === 'pending' && 'bg-amber-400',
        status === 'approved' && 'bg-green-400',
        status === 'published' && 'bg-blue-400',
        status === 'rejected' && 'bg-red-400',
        status === 'expired' && 'bg-gray-500',
      )} />
      {config.label}
    </Badge>
  );
}
