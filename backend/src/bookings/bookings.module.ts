import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Booking } from './entities/booking.entity';
import { Event } from '../events/entities/event.entity';
import { BookingsService, BOOKING_QUEUE } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingProcessor } from './booking.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Event]),
    BullModule.registerQueue({ name: BOOKING_QUEUE }),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingProcessor],
})
export class BookingsModule {}
