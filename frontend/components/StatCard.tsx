import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  iconBgClassName?: string;
  accentClassName?: string;
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName = 'text-brand',
  iconBgClassName = 'bg-brand-muted',
  accentClassName = 'bg-brand',
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-6 shadow-sm shadow-black/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.06]">
      <div
        className={cn('absolute inset-y-0 left-0 w-1 rounded-l-2xl', accentClassName)}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-4 pl-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105',
            iconBgClassName
          )}
        >
          <Icon className={cn('h-5 w-5', iconClassName)} />
        </div>
      </div>
    </div>
  );
}
