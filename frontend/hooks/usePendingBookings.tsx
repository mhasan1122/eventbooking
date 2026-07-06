'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Booking,
  BookingStatus,
  CreateBookingPayload,
  CreateBookingResponse,
  Event,
} from '@/types';

const MIN_PENDING_MS = 2500;

interface PendingEntry {
  booking: Booking;
  serverStatus: BookingStatus | null;
  createdAt: number;
}

interface PendingBookingsContextValue {
  register: (
    result: CreateBookingResponse,
    payload: CreateBookingPayload,
    event?: Event
  ) => void;
  syncFromServer: (serverBookings: Booking[]) => void;
  mergeBookings: (serverBookings: Booking[]) => Booking[];
  hasActivePending: boolean;
}

const PendingBookingsContext = createContext<PendingBookingsContextValue | null>(
  null
);

function placeholderEvent(eventId: number): Event {
  return {
    id: eventId,
    name: `Event #${eventId}`,
    date: new Date().toISOString(),
    totalSeats: 0,
    remainingSeats: 0,
    price: '0',
  };
}

function buildPendingBooking(
  result: CreateBookingResponse,
  payload: CreateBookingPayload,
  event?: Event
): Booking {
  const now = new Date().toISOString();
  return {
    id: -1,
    requestId: payload.requestId,
    bookingRef: result.bookingRef,
    eventId: payload.eventId,
    event: event ?? placeholderEvent(payload.eventId),
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    seats: payload.seats,
    status: 'PENDING',
    failReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function PendingBookingsProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Map<string, PendingEntry>>(new Map());
  const [tick, setTick] = useState(0);

  const register = useCallback(
    (
      result: CreateBookingResponse,
      payload: CreateBookingPayload,
      event?: Event
    ) => {
      setEntries((prev) => {
        const next = new Map(prev);
        next.set(result.bookingRef, {
          booking: buildPendingBooking(result, payload, event),
          serverStatus: null,
          createdAt: Date.now(),
        });
        return next;
      });
    },
    []
  );

  const syncFromServer = useCallback((serverBookings: Booking[]) => {
    setEntries((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const booking of serverBookings) {
        const entry = next.get(booking.bookingRef);
        if (entry && entry.serverStatus !== booking.status) {
          next.set(booking.bookingRef, {
            ...entry,
            serverStatus: booking.status,
            booking: { ...entry.booking, ...booking },
          });
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const resolveDisplayStatus = useCallback(
    (booking: Booking): BookingStatus => {
      const entry = entries.get(booking.bookingRef);
      if (!entry) return booking.status;

      const elapsed = Date.now() - entry.createdAt;
      if (elapsed < MIN_PENDING_MS) return 'PENDING';

      return entry.serverStatus ?? booking.status;
    },
    [entries, tick]
  );

  const mergeBookings = useCallback(
    (serverBookings: Booking[]): Booking[] => {
      const serverRefs = new Set(serverBookings.map((b) => b.bookingRef));
      const merged = serverBookings.map((booking) => ({
        ...booking,
        status: resolveDisplayStatus(booking),
      }));

      for (const [ref, entry] of entries) {
        if (!serverRefs.has(ref)) {
          merged.unshift(entry.booking);
        }
      }

      return merged;
    },
    [entries, resolveDisplayStatus]
  );

  const hasActivePending = useMemo(() => {
    return Array.from(entries.values()).some((entry) => {
      const elapsed = Date.now() - entry.createdAt;
      if (elapsed < MIN_PENDING_MS) return true;
      return entry.serverStatus === null || entry.serverStatus === 'PENDING';
    });
  }, [entries, tick]);

  useEffect(() => {
    if (entries.size === 0) return;

    const interval = window.setInterval(() => {
      setTick((n) => n + 1);
      setEntries((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [ref, entry] of next) {
          const elapsed = Date.now() - entry.createdAt;
          if (
            elapsed >= MIN_PENDING_MS &&
            entry.serverStatus &&
            entry.serverStatus !== 'PENDING'
          ) {
            next.delete(ref);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 400);

    return () => window.clearInterval(interval);
  }, [entries.size]);

  const value = useMemo(
    () => ({ register, syncFromServer, mergeBookings, hasActivePending }),
    [register, syncFromServer, mergeBookings, hasActivePending]
  );

  return (
    <PendingBookingsContext.Provider value={value}>
      {children}
    </PendingBookingsContext.Provider>
  );
}

export function usePendingBookings() {
  const ctx = useContext(PendingBookingsContext);
  if (!ctx) {
    throw new Error('usePendingBookings must be used within PendingBookingsProvider');
  }
  return ctx;
}
