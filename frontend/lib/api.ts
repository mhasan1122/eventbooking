import apiClient from '@/lib/api-client';
import {
  BookingsResponse,
  EventsResponse,
  CreateBookingPayload,
  CreateBookingResponse,
  BookingFilters,
} from '@/types';

export const eventsApi = {
  getAll: async (): Promise<EventsResponse> => {
    const { data } = await apiClient.get('/events');
    return data;
  },
};

export const bookingsApi = {
  getAll: async (filters: Partial<BookingFilters>): Promise<BookingsResponse> => {
    const params: Record<string, string | number> = {
      page: filters.page || 1,
      limit: filters.limit || 10,
    };
    if (filters.eventId && filters.eventId !== 'all') params.eventId = filters.eventId;
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    const { data } = await apiClient.get('/bookings', { params });
    return data;
  },

  create: async (payload: CreateBookingPayload): Promise<CreateBookingResponse> => {
    const { data } = await apiClient.post('/bookings', payload, {
      validateStatus: (status) => status === 202 || status === 200,
    });
    return data;
  },
};
