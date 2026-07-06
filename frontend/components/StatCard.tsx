import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  iconBgClassName?: string;
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName = 'text-[#111827]',
  iconBgClassName = 'bg-[#F3F4F6]',
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-[#111827]">{value}</p>
          <p className="mt-1 text-xs text-[#6B7280]">{description}</p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            iconBgClassName
          )}
        >
          <Icon className={cn('h-5 w-5', iconClassName)} />
        </div>
      </div>
    </div>
  );
}
