import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Event } from '../events/entities/event.entity';
import { BOOKING_QUEUE } from './bookings.service';

@Processor(BOOKING_QUEUE)
export class BookingProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingProcessor.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<{ bookingId: number }>): Promise<void> {
    const { bookingId } = job.data;
    this.logger.log(`Processing booking job for bookingId: ${bookingId}`);

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found`);
      return;
    }

    if (booking.status !== BookingStatus.PENDING) {
      this.logger.log(
        `Booking ${bookingId} already ${booking.status}, skipping`,
      );
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lockedBooking = await queryRunner.manager
        .getRepository(Booking)
        .createQueryBuilder('booking')
        .setLock('pessimistic_write')
        .where('booking.id = :id', { id: bookingId })
        .getOne();

      if (!lockedBooking || lockedBooking.status !== BookingStatus.PENDING) {
        await queryRunner.commitTransaction();
        this.logger.log(
          `Booking ${bookingId} no longer pending after lock, skipping`,
        );
        return;
      }

      const event = await queryRunner.manager
        .getRepository(Event)
        .createQueryBuilder('event')
        .setLock('pessimistic_write')
        .where('event.id = :id', { id: lockedBooking.eventId })
        .getOne();

      if (!event) {
        await this.failBooking(queryRunner, lockedBooking, 'Event not found');
        return;
      }

      if (event.remainingSeats < lockedBooking.seats) {
        await this.failBooking(
          queryRunner,
          lockedBooking,
          `Not enough seats. Requested: ${lockedBooking.seats}, Available: ${event.remainingSeats}`,
        );
        return;
      }

      event.remainingSeats -= lockedBooking.seats;
      await queryRunner.manager.save(Event, event);

      lockedBooking.status = BookingStatus.CONFIRMED;
      lockedBooking.failReason = null;
      await queryRunner.manager.save(Booking, lockedBooking);

      await queryRunner.commitTransaction();
      this.logger.log(
        `Booking ${bookingId} CONFIRMED. Seats remaining: ${event.remainingSeats}`,
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Booking ${bookingId} processing failed: ${(err as Error).message}`,
      );
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async failBooking(
    queryRunner: QueryRunner,
    booking: Booking,
    reason: string,
  ): Promise<void> {
    booking.status = BookingStatus.FAILED;
    booking.failReason = reason;
    await queryRunner.manager.save(Booking, booking);
    await queryRunner.commitTransaction();
    this.logger.warn(`Booking ${booking.id} FAILED: ${reason}`);
  }
}
