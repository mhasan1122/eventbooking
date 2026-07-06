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
    <div className="flex flex-col gap-1.5 rounded-xl bg-muted/40 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{value}</dd>
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
            'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
            'data-open:animate-in data-open:fade-in-0',
            'data-closed:animate-out data-closed:fade-out-0'
          )}
        />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup
            className={cn(
              'relative w-full max-w-lg rounded-2xl border border-border/80 bg-surface shadow-2xl',
              'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
              'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
            )}
          >
            <div className="flex items-start justify-between border-b border-border/80 px-6 py-5">
              <div>
                <Dialog.Title className="text-lg font-bold text-foreground">
                  Booking Details
                </Dialog.Title>
                <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
                  Full information for this booking
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                }
              />
            </div>

            <dl className="space-y-3 px-6 py-5">
              <DetailRow
                label="Booking Reference"
                value={
                  <code className="rounded-lg bg-muted px-2 py-1 font-mono text-sm">
                    {booking.bookingRef}
                  </code>
                }
              />
              <DetailRow label="Event" value={eventName} />
              {eventDate && <DetailRow label="Event Date" value={eventDate} />}
              <DetailRow label="Customer" value={booking.customerName} />
              <DetailRow label="Email" value={booking.customerEmail} />
              <DetailRow label="Seats Booked" value={booking.seats} />
              {booking.event && (
                <DetailRow
                  label="Seats Remaining (event)"
                  value={booking.event.remainingSeats}
                />
              )}
              <DetailRow
                label="Status"
                value={<StatusBadge status={booking.status} />}
              />
              {booking.failReason && (
                <DetailRow
                  label="Failure Reason"
                  value={
                    <span className="text-destructive">{booking.failReason}</span>
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
                  <code className="break-all rounded-lg bg-muted px-2 py-1 font-mono text-sm">
                    {booking.requestId}
                  </code>
                }
              />
            </dl>

            <div className="flex justify-end border-t border-border/80 px-6 py-5">
              <Dialog.Close
                render={
                  <Button type="button" variant="outline" size="default" className="px-5">
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
