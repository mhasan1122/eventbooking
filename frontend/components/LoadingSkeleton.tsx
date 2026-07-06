import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-5 px-6">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-5 w-44 rounded-lg" />
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-5 w-12 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}
