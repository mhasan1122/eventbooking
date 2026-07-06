'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-md shadow-brand/25">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Event Booking
              </h1>
              <span className="hidden items-center gap-1 rounded-full bg-brand-muted px-2 py-0.5 text-xs font-medium text-brand sm:inline-flex">
                <Sparkles className="h-3 w-3" />
                Dashboard
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage bookings and event availability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground lg:block">{today}</span>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
            aria-label="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
