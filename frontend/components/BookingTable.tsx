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
    <div className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[#111827]">Bookings</h2>
          <p className="text-xs text-[#6B7280]">
            {total} booking{total !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {/* Table Content */}
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
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                <TableHead className="pl-5 text-xs font-medium text-[#6B7280]">
                  Booking Ref
                </TableHead>
                <TableHead className="text-xs font-medium text-[#6B7280]">
                  Event
                </TableHead>
                <TableHead className="text-xs font-medium text-[#6B7280]">
                  Customer
                </TableHead>
                <TableHead className="text-xs font-medium text-[#6B7280]">
                  Email
                </TableHead>
                <TableHead className="text-center text-xs font-medium text-[#6B7280]">
                  Seats
                </TableHead>
                <TableHead className="text-xs font-medium text-[#6B7280]">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium text-[#6B7280]">
                  Created
                </TableHead>
                <TableHead className="pr-5 text-right text-xs font-medium text-[#6B7280]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow
                  key={booking.bookingRef}
                  className="border-[#E5E7EB] transition-colors hover:bg-[#F8FAFC]"
                >
                  <TableCell className="pl-5">
                    <code className="rounded bg-[#F3F4F6] px-1.5 py-0.5 font-mono text-xs text-[#111827]">
                      {booking.bookingRef.slice(0, 8)}…
                    </code>
                  </TableCell>
                  <TableCell className="max-w-[160px]">
                    <span className="block truncate text-sm font-medium text-[#111827]">
                      {booking.event?.name ?? `Event #${booking.eventId}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#111827]">{booking.customerName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#6B7280]">{booking.customerEmail}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium text-[#111827]">
                      {booking.seats}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-[#6B7280]">
                      {format(new Date(booking.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openBookingDetails(booking)}
                        className="h-7 gap-1 px-2 text-xs text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
                        title="View booking details"
                        aria-label={`View booking ${booking.bookingRef}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onRefresh}
                        className="h-7 gap-1 px-2 text-xs text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
                        title="Refresh status"
                        aria-label={`Refresh status for booking ${booking.bookingRef}`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !isError && total > 0 && (
        <div className="border-t border-[#E5E7EB]">
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
