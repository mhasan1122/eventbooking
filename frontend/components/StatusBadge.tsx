import { BookingStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

interface StatusBadgeProps {
  status: BookingStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        config.className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', {
          'bg-green-600': status === 'CONFIRMED',
          'bg-blue-600': status === 'PENDING',
          'bg-red-600': status === 'FAILED',
        })}
      />
      {config.label}
    </span>
  );
}
