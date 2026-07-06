'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Event } from '@/types';
import { useCreateBooking } from '@/hooks/useBookings';

const schema = z.object({
  eventId: z.string().min(1, 'Please select an event'),
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  customerEmail: z.string().email('Invalid email address'),
  seats: z
    .number({ error: 'Seats must be a number' })
    .int()
    .min(1, 'At least 1 seat required')
    .max(20, 'Maximum 20 seats per booking'),
});

type FormValues = z.infer<typeof schema>;

interface BookingFormProps {
  events: Event[];
}

export function BookingForm({ events }: BookingFormProps) {
  const { mutateAsync, isPending } = useCreateBooking();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { eventId: '', customerName: '', customerEmail: '', seats: 1 },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await mutateAsync({
        requestId: uuidv4(),
        eventId: Number(values.eventId),
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        seats: values.seats,
      });
      toast.success('Booking accepted', {
        description: `Status: ${result.status} — Ref: ${result.bookingRef.slice(0, 8)}…`,
        duration: 5000,
      });
      reset({ eventId: '', customerName: '', customerEmail: '', seats: 1 });
    } catch (error) {
      let description = 'Please check your inputs and try again.';
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        description = Array.isArray(apiMessage)
          ? apiMessage.join(', ')
          : apiMessage ?? error.message;
      } else if (error instanceof Error) {
        description = error.message;
      }
      toast.error('Failed to submit booking', { description, duration: 5000 });
    }
  };

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h2 className="text-sm font-semibold text-[#111827]">Create Booking</h2>
        <p className="text-xs text-[#6B7280]">Fill in the details to book seats</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5" noValidate>
        {/* Event */}
        <div className="space-y-1.5">
          <label
            htmlFor="form-event"
            className="block text-xs font-medium text-[#111827]"
          >
            Event <span className="text-red-500">*</span>
          </label>
          <Controller
            name="eventId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? '')}
              >
                <SelectTrigger
                  id="form-event"
                  className="h-9 w-full border-[#E5E7EB] text-sm focus:ring-[#111827]"
                  aria-describedby={errors.eventId ? 'event-error' : undefined}
                >
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={String(event.id)}>
                      {event.name} ({event.remainingSeats} left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.eventId && (
            <p id="event-error" className="text-xs text-red-500" role="alert">
              {errors.eventId.message}
            </p>
          )}
        </div>

        {/* Customer Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="form-name"
            className="block text-xs font-medium text-[#111827]"
          >
            Customer Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="form-name"
            placeholder="e.g. Rahim Uddin"
            {...register('customerName')}
            className="h-9 border-[#E5E7EB] text-sm placeholder:text-[#6B7280] focus-visible:ring-[#111827]"
            aria-describedby={errors.customerName ? 'name-error' : undefined}
          />
          {errors.customerName && (
            <p id="name-error" className="text-xs text-red-500" role="alert">
              {errors.customerName.message}
            </p>
          )}
        </div>

        {/* Customer Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="form-email"
            className="block text-xs font-medium text-[#111827]"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <Input
            id="form-email"
            type="email"
            placeholder="rahim@example.com"
            {...register('customerEmail')}
            className="h-9 border-[#E5E7EB] text-sm placeholder:text-[#6B7280] focus-visible:ring-[#111827]"
            aria-describedby={errors.customerEmail ? 'email-error' : undefined}
          />
          {errors.customerEmail && (
            <p id="email-error" className="text-xs text-red-500" role="alert">
              {errors.customerEmail.message}
            </p>
          )}
        </div>

        {/* Seats */}
        <div className="space-y-1.5">
          <label
            htmlFor="form-seats"
            className="block text-xs font-medium text-[#111827]"
          >
            Number of Seats <span className="text-red-500">*</span>
          </label>
          <Input
            id="form-seats"
            type="number"
            min={1}
            max={20}
            placeholder="1"
            {...register('seats', { valueAsNumber: true })}
            className="h-9 border-[#E5E7EB] text-sm focus-visible:ring-[#111827]"
            aria-describedby={errors.seats ? 'seats-error' : undefined}
          />
          {errors.seats && (
            <p id="seats-error" className="text-xs text-red-500" role="alert">
              {errors.seats.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending || events.length === 0}
          className="mt-2 h-9 w-full gap-2 bg-[#111827] text-sm text-white hover:bg-[#111827]/90 disabled:opacity-60"
          aria-label="Submit booking"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Submit Booking
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
