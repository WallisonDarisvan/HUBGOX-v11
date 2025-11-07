import { Badge } from '@/components/ui/badge';

interface LimitBadgeProps {
  used: number;
  limit: number;
  resource: string;
}

export function LimitBadge({ used, limit, resource }: LimitBadgeProps) {
  const percentage = (used / limit) * 100;
  const variant = percentage >= 100 ? 'destructive' : percentage >= 80 ? 'secondary' : 'default';
  
  return (
    <Badge variant={variant} className="text-xs">
      {used} / {limit} {resource}
    </Badge>
  );
}
