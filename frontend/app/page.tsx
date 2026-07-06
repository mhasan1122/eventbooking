'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { BookingFiltersBar } from '@/components/BookingFilters';
import { BookingTable } from '@/components/BookingTable';
import { BookingForm } from '@/components/BookingForm';
import { StatCardSkeleton } from '@/components/LoadingSkeleton';
import {
  useBookings,
  useEvents,
  useBookingFilters,
  useBookingStatusCount,
  BOOKINGS_KEY,
  EVENTS_KEY,
} from '@/hooks/useBookings';
import { usePendingBookings } from '@/hooks/usePendingBookings';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { filters, updateFilter, resetFilters } = useBookingFilters();
  const { mergeBookings, syncFromServer, hasActivePending } = usePendingBookings();

  const eventsQuery = useEvents();
  const bookingsQuery = useBookings(filters, hasActivePending);
  const confirmedTotalQuery = useBookingStatusCount('CONFIRMED');
  const pendingTotalQuery = useBookingStatusCount('PENDING');
  const failedTotalQuery = useBookingStatusCount('FAILED');

  const events = eventsQuery.data?.data ?? [];
  const serverBookings = bookingsQuery.data?.data ?? [];
  const total = bookingsQuery.data?.total ?? 0;

  useEffect(() => {
    if (bookingsQuery.data?.data) {
      syncFromServer(bookingsQuery.data.data);
    }
  }, [bookingsQuery.dataUpdatedAt, bookingsQuery.data, syncFromServer]);

  const bookings = mergeBookings(serverBookings);

  const searchTerm = filters.search.trim().toLowerCase();
  const displayedBookings = searchTerm
    ? bookings.filter(
        (b) =>
          b.customerName.toLowerCase().includes(searchTerm) ||
          b.customerEmail.toLowerCase().includes(searchTerm) ||
          b.bookingRef.toLowerCase().includes(searchTerm)
      )
    : bookings;

  const isRefreshing = bookingsQuery.isFetching || eventsQuery.isFetching;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [BOOKINGS_KEY] });
    queryClient.invalidateQueries({ queryKey: [EVENTS_KEY] });
  };

  const statsLoading =
    confirmedTotalQuery.isLoading ||
    pendingTotalQuery.isLoading ||
    failedTotalQuery.isLoading;

  return (
    <div className="flex min-h-screen flex-col">
      <Header onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-8 sm:px-8">
        {/* Overview */}
        <section className="mb-8">
          <h2 className="section-title">Overview</h2>
          <p className="section-subtitle">Live snapshot of your events and bookings</p>
        </section>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {eventsQuery.isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label="Total Events"
                value={eventsQuery.data?.total ?? 0}
                description="Active events available"
                icon={Ticket}
                iconBgClassName="bg-muted"
                iconClassName="text-foreground"
                accentClassName="bg-foreground"
              />
              <StatCard
                label="Confirmed"
                value={statsLoading ? '—' : (confirmedTotalQuery.data ?? 0)}
                description="Successfully processed"
                icon={CheckCircle2}
                iconBgClassName="bg-green-50"
                iconClassName="text-green-600"
                accentClassName="bg-green-500"
              />
              <StatCard
                label="Pending"
                value={
                  statsLoading
                    ? '—'
                    : Math.max(pendingTotalQuery.data ?? 0, hasActivePending ? 1 : 0)
                }
                description="Awaiting processing"
                icon={Clock}
                iconBgClassName="bg-blue-50"
                iconClassName="text-blue-600"
                accentClassName="bg-blue-500"
              />
              <StatCard
                label="Failed"
                value={statsLoading ? '—' : (failedTotalQuery.data ?? 0)}
                description="Sold out or invalid"
                icon={XCircle}
                iconBgClassName="bg-red-50"
                iconClassName="text-red-600"
                accentClassName="bg-red-500"
              />
            </>
          )}
        </div>

        {/* Filters */}
        <section className="mb-6">
          <BookingFiltersBar
            filters={filters}
            events={events}
            onFilterChange={updateFilter}
            onReset={resetFilters}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </section>

        {/* Main Grid: Table + Form */}
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1">
            <BookingTable
              bookings={displayedBookings}
              total={searchTerm ? displayedBookings.length : total}
              filters={filters}
              isLoading={bookingsQuery.isLoading}
              isError={bookingsQuery.isError}
              onFilterChange={updateFilter}
              onRefresh={handleRefresh}
            />
          </div>

          <aside className="w-full xl:w-[400px] xl:shrink-0">
            <div className="xl:sticky xl:top-28">
              <BookingForm events={events} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
