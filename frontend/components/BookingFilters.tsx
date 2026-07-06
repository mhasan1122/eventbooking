'use client';

import { Search, RefreshCw, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Event, BookingFilters } from '@/types';

interface BookingFiltersProps {
  filters: BookingFilters;
  events: Event[];
  onFilterChange: (key: keyof BookingFilters, value: string | number) => void;
  onReset: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function BookingFiltersBar({
  filters,
  events,
  onFilterChange,
  onReset,
  onRefresh,
  isRefreshing,
}: BookingFiltersProps) {
  return (
    <div className="panel p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Search &amp; Filter</h2>
        <p className="text-sm text-muted-foreground">Find bookings by customer, event, or status</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:flex-wrap">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="filter-search"
            placeholder="Search customer, email, or ref..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="h-9 pl-9"
            aria-label="Search bookings"
          />
        </div>

        <Select
          value={filters.eventId ?? 'all'}
          onValueChange={(val) => onFilterChange('eventId', val as string)}
        >
          <SelectTrigger
            id="filter-event"
            className="h-9 w-full lg:w-[200px]"
            aria-label="Filter by event"
          >
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={String(event.id)}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status ?? 'all'}
          onValueChange={(val) => onFilterChange('status', val as string)}
        >
          <SelectTrigger
            id="filter-status"
            className="h-9 w-full lg:w-[160px]"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-1.5"
            aria-label="Reset filters"
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
            aria-label="Refresh bookings"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
