import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  onRetry?: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-[#111827]">Something went wrong</h3>
      <p className="mb-4 max-w-xs text-sm text-[#6B7280]">
        Failed to load data. Please check your connection and try again.
      </p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-[#E5E7EB] text-[#111827] hover:bg-[#F3F4F6]"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
