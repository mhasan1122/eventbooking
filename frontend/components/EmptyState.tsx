import { Inbox } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">No bookings found</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        No bookings available. Create your first booking or adjust your filters.
      </p>
    </div>
  );
}
