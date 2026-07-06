import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  onRetry?: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">Something went wrong</h3>
      <p className="mb-5 max-w-sm text-sm text-muted-foreground">
        Failed to load data. Please check your connection and try again.
      </p>
      {onRetry && (
        <Button type="button" variant="outline" size="default" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
