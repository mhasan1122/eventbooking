'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, eventsApi } from '@/lib/api';
import {
  BookingFilters,
  BookingStatus,
  CreateBookingPayload,
  EventsResponse,
} from '@/types';
import { usePendingBookings } from '@/hooks/usePendingBookings';

export const BOOKINGS_KEY = 'bookings';
export const EVENTS_KEY = 'events';

export function useEvents() {
  return useQuery({
    queryKey: [EVENTS_KEY],
    queryFn: eventsApi.getAll,
    staleTime: 60_000,
  });
}

export function useBookings(
  filters: Partial<BookingFilters>,
  pollWhilePending = false
) {
  return useQuery({
    queryKey: [BOOKINGS_KEY, filters],
    queryFn: () => bookingsApi.getAll(filters),
    staleTime: 0,
    refetchInterval: pollWhilePending ? 1_500 : false,
  });
}

export function useBookingStatusCount(status: BookingStatus) {
  return useQuery({
    queryKey: [BOOKINGS_KEY, 'count', status],
    queryFn: () =>
      bookingsApi.getAll({ status, page: 1, limit: 1 }),
    select: (data) => data.total,
    staleTime: 5_000,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { register } = usePendingBookings();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingsApi.create(payload),
    onSuccess: (result, payload) => {
      const events = queryClient.getQueryData<EventsResponse>([EVENTS_KEY]);
      const event = events?.data.find((e) => e.id === payload.eventId);

      register(result, payload, event);

      void queryClient.invalidateQueries({ queryKey: [BOOKINGS_KEY] });
      void queryClient.invalidateQueries({ queryKey: [EVENTS_KEY] });
      void queryClient.invalidateQueries({ queryKey: [BOOKINGS_KEY, 'count'] });
    },
  });
}

export function useBookingFilters() {
  const [filters, setFilters] = useState<BookingFilters>({
    search: '',
    eventId: 'all',
    status: 'all',
    page: 1,
    limit: 10,
  });

  const updateFilter = (key: keyof BookingFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {}),
    }));
  };

  const resetFilters = () => {
    setFilters({ search: '', eventId: 'all', status: 'all', page: 1, limit: 10 });
  };

  return { filters, updateFilter, resetFilters };
}
