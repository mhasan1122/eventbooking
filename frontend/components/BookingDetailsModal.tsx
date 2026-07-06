'use client';

import { type ReactNode } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { Booking } from '@/types';
import { cn } from '@/lib/utils';

interface BookingDetailsModalProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <dt className="text-xs font-medium text-[#6B7280]">{label}</dt>
      <dd className="text-sm text-[#111827] sm:text-right">{value}</dd>
    </div>
  );
}

export function BookingDetailsModal({
  booking,
  open,
  onOpenChange,
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const eventName = booking.event?.name ?? `Event #${booking.eventId}`;
  const eventDate = booking.event?.date
    ? format(new Date(booking.event.date), 'MMM d, yyyy · h:mm a')
    : null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            'fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]',
            'data-open:animate-in data-open:fade-in-0',
            'data-closed:animate-out data-closed:fade-out-0'
          )}
        />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup
            className={cn(
              'relative w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white shadow-lg',
              'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
              'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
            )}
          >
            <div className="flex items-start justify-between border-b border-[#E5E7EB] px-5 py-4">
              <div>
                <Dialog.Title className="text-sm font-semibold text-[#111827]">
                  Booking Details
                </Dialog.Title>
                <Dialog.Description className="mt-0.5 text-xs text-[#6B7280]">
                  Full information for this booking
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                }
              />
            </div>

            <dl className="space-y-4 px-5 py-4">
              <DetailRow
                label="Booking Reference"
                value={
                  <code className="rounded bg-[#F3F4F6] px-1.5 py-0.5 font-mono text-xs">
                    {booking.bookingRef}
                  </code>
                }
              />
              <DetailRow label="Event" value={eventName} />
              {eventDate && <DetailRow label="Event Date" value={eventDate} />}
              <DetailRow label="Customer" value={booking.customerName} />
              <DetailRow label="Email" value={booking.customerEmail} />
              <DetailRow label="Seats" value={booking.seats} />
              <DetailRow
                label="Status"
                value={<StatusBadge status={booking.status} />}
              />
              {booking.failReason && (
                <DetailRow
                  label="Failure Reason"
                  value={
                    <span className="text-red-600">{booking.failReason}</span>
                  }
                />
              )}
              <DetailRow
                label="Created"
                value={format(new Date(booking.createdAt), 'MMM d, yyyy · h:mm a')}
              />
              <DetailRow
                label="Request ID"
                value={
                  <code className="break-all rounded bg-[#F3F4F6] px-1.5 py-0.5 font-mono text-xs">
                    {booking.requestId}
                  </code>
                }
              />
            </dl>

            <div className="flex justify-end border-t border-[#E5E7EB] px-5 py-4">
              <Dialog.Close
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#E5E7EB] text-[#111827] hover:bg-[#F3F4F6]"
                  >
                    Close
                  </Button>
                }
              />
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
