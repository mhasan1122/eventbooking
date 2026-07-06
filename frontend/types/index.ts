// Types matching the NestJS backend models

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Event {
  id: number;
  name: string;
  date: string;
  totalSeats: number;
  remainingSeats: number;
  price: string;
}

export interface Booking {
  id: number;
  requestId: string;
  bookingRef: string;
  eventId: number;
  event: Event;
  customerName: string;
  customerEmail: string;
  seats: number;
  status: BookingStatus;
  failReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingsResponse {
  data: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventsResponse {
  data: Event[];
  total: number;
}

export interface CreateBookingPayload {
  requestId: string;
  eventId: number;
  customerName: string;
  customerEmail: string;
  seats: number;
}

export interface CreateBookingResponse {
  bookingRef: string;
  status: BookingStatus;
  message: string;
}

export interface BookingFilters {
  search: string;
  eventId: string;
  status: string;
  page: number;
  limit: number;
}
