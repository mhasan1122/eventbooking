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
        description: `Status: ${result.status} — Ref: ${result.bookingRef}`,
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
    <div className="panel overflow-hidden">
      <div className="panel-header bg-gradient-to-br from-brand-muted/60 to-transparent">
        <h2 className="section-title">Create Booking</h2>
        <p className="section-subtitle">Fill in the details to reserve seats</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6" noValidate>
        <div className="space-y-2">
          <label htmlFor="form-event" className="form-label">
            Event <span className="text-destructive">*</span>
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
                  className="h-9 w-full"
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
            <p id="event-error" className="form-error" role="alert">
              {errors.eventId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="form-name" className="form-label">
            Customer Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="form-name"
            placeholder="e.g. Rahim Uddin"
            {...register('customerName')}
            className="h-9"
            aria-describedby={errors.customerName ? 'name-error' : undefined}
          />
          {errors.customerName && (
            <p id="name-error" className="form-error" role="alert">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="form-email" className="form-label">
            Email Address <span className="text-destructive">*</span>
          </label>
          <Input
            id="form-email"
            type="email"
            placeholder="rahim@example.com"
            {...register('customerEmail')}
            className="h-9"
            aria-describedby={errors.customerEmail ? 'email-error' : undefined}
          />
          {errors.customerEmail && (
            <p id="email-error" className="form-error" role="alert">
              {errors.customerEmail.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="form-seats" className="form-label">
            Number of Seats <span className="text-destructive">*</span>
          </label>
          <Input
            id="form-seats"
            type="number"
            min={1}
            max={20}
            placeholder="1"
            {...register('seats', { valueAsNumber: true })}
            className="h-9"
            aria-describedby={errors.seats ? 'seats-error' : undefined}
          />
          {errors.seats && (
            <p id="seats-error" className="form-error" role="alert">
              {errors.seats.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending || events.length === 0}
          size="default"
          className="mt-2 h-9 w-full gap-2 bg-brand text-sm text-brand-foreground hover:bg-brand/90"
          aria-label="Submit booking"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Submit Booking
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
