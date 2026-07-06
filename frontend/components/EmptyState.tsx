import { Inbox } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6]">
        <Inbox className="h-8 w-8 text-[#6B7280]" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-[#111827]">No bookings found</h3>
      <p className="max-w-xs text-sm text-[#6B7280]">
        No bookings available. Create your first booking or adjust your filters.
      </p>
    </div>
  );
}
