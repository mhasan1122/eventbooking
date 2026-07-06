import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';

export const BOOKING_QUEUE = 'bookings';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectQueue(BOOKING_QUEUE)
    private readonly bookingQueue: Queue,
  ) {}

  async create(dto: CreateBookingDto): Promise<{
    bookingRef: string;
    status: BookingStatus;
    statusCode: number;
  }> {
    const existing = await this.bookingRepository.findOne({
      where: { requestId: dto.requestId },
    });

    if (existing) {
      return this.toExistingResponse(existing);
    }

    const bookingRef = uuidv4();
    const booking = this.bookingRepository.create({
      requestId: dto.requestId,
      bookingRef,
      eventId: dto.eventId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      seats: dto.seats,
      status: BookingStatus.PENDING,
    });

    try {
      await this.bookingRepository.save(booking);
    } catch (err) {
      if (this.isUniqueRequestIdViolation(err)) {
        const duplicate = await this.bookingRepository.findOne({
          where: { requestId: dto.requestId },
        });
        if (duplicate) {
          return this.toExistingResponse(duplicate);
        }
      }
      throw err;
    }

    await this.bookingQueue.add(
      'process-booking',
      { bookingId: booking.id },
      {
        jobId: dto.requestId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    return {
      bookingRef,
      status: BookingStatus.PENDING,
      statusCode: HttpStatus.ACCEPTED,
    };
  }

  async findAll(query: QueryBookingsDto): Promise<{
    data: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { eventId, status, page = 1, limit = 10 } = query;

    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.event', 'event')
      .orderBy('booking.createdAt', 'DESC');

    if (eventId) {
      qb.andWhere('booking.eventId = :eventId', { eventId });
    }

    if (status) {
      qb.andWhere('booking.status = :status', { status });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private toExistingResponse(booking: Booking): {
    bookingRef: string;
    status: BookingStatus;
    statusCode: number;
  } {
    return {
      bookingRef: booking.bookingRef,
      status: booking.status,
      statusCode: HttpStatus.OK,
    };
  }

  private isUniqueRequestIdViolation(err: unknown): boolean {
    return (
      err instanceof QueryFailedError &&
      (err.driverError as { code?: string })?.code === '23505'
    );
  }
}
