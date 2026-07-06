'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { TableSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Pagination } from './Pagination';
import { BookingDetailsModal } from './BookingDetailsModal';
import { Booking, BookingFilters } from '@/types';

interface BookingTableProps {
  bookings: Booking[];
  total: number;
  filters: BookingFilters;
  isLoading: boolean;
  isError: boolean;
  onFilterChange: (key: keyof BookingFilters, value: string | number) => void;
  onRefresh: () => void;
}

function shortRef(ref: string) {
  if (ref.length <= 14) return ref;
  return `${ref.slice(0, 8)}…${ref.slice(-4)}`;
}

export function BookingTable({
  bookings,
  total,
  filters,
  isLoading,
  isError,
  onFilterChange,
  onRefresh,
}: BookingTableProps) {
  const totalPages = Math.ceil(total / filters.limit);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSelectedBooking(null);
    }
  };

  return (
    <>
      <div className="panel overflow-hidden">
        <div className="panel-header py-3">
          <h2 className="text-sm font-semibold text-foreground">Bookings</h2>
          <p className="text-xs text-muted-foreground">
            {total} booking{total !== 1 ? 's' : ''} total
          </p>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-4">
              <TableSkeleton />
            </div>
          ) : isError ? (
            <ErrorState onRetry={onRefresh} />
          ) : bookings.length === 0 ? (
            <EmptyState />
          ) : (
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="h-8 pl-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Ref
                  </TableHead>
                  <TableHead className="h-8 max-w-[130px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Event
                  </TableHead>
                  <TableHead className="h-8 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Customer
                  </TableHead>
                  <TableHead className="h-8 max-w-[150px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="h-8 w-12 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Seats
                  </TableHead>
                  <TableHead className="h-8 w-12 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Left
                  </TableHead>
                  <TableHead className="h-8 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-8 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Created
                  </TableHead>
                  <TableHead className="h-8 w-16 pr-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow
                    key={booking.bookingRef}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="py-1.5 pl-4">
                      <code
                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                        title={booking.bookingRef}
                      >
                        {shortRef(booking.bookingRef)}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[130px] py-1.5">
                      <span
                        className="block truncate text-xs font-medium text-foreground"
                        title={booking.event?.name ?? `Event #${booking.eventId}`}
                      >
                        {booking.event?.name ?? `Event #${booking.eventId}`}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="truncate text-xs text-foreground">
                        {booking.customerName}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[150px] py-1.5">
                      <span
                        className="block truncate text-xs text-muted-foreground"
                        title={booking.customerEmail}
                      >
                        {booking.customerEmail}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5 text-center">
                      <span className="text-xs font-semibold tabular-nums text-foreground">
                        {booking.seats}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5 text-center">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {booking.event?.remainingSeats ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(booking.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openBookingDetails(booking)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="View details"
                          aria-label={`View booking ${booking.bookingRef}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={onRefresh}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Refresh status"
                          aria-label={`Refresh booking ${booking.bookingRef}`}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {!isLoading && !isError && total > 0 && (
          <div className="border-t border-border/80">
            <Pagination
              page={filters.page}
              totalPages={totalPages}
              total={total}
              limit={filters.limit}
              onPageChange={(p) => onFilterChange('page', p)}
            />
          </div>
        )}
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
      />
    </>
  );
}
