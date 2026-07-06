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
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
          <Input
            id="filter-search"
            placeholder="Search customer..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9 h-9 border-[#E5E7EB] text-sm placeholder:text-[#6B7280] focus-visible:ring-[#111827]"
            aria-label="Search by customer name"
          />
        </div>

        {/* Event Select */}
        <Select
          value={filters.eventId ?? 'all'}
          onValueChange={(val) => onFilterChange('eventId', val as string)}
        >
          <SelectTrigger
            id="filter-event"
            className="h-9 w-full border-[#E5E7EB] text-sm sm:w-[200px] focus:ring-[#111827]"
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

        {/* Status Select */}
        <Select
          value={filters.status ?? 'all'}
          onValueChange={(val) => onFilterChange('status', val as string)}
        >
          <SelectTrigger
            id="filter-status"
            className="h-9 w-full border-[#E5E7EB] text-sm sm:w-[160px] focus:ring-[#111827]"
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

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-9 gap-1.5 border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
            aria-label="Reset filters"
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 gap-1.5 border-[#E5E7EB] text-[#111827] hover:bg-[#F3F4F6]"
            aria-label="Refresh bookings"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
