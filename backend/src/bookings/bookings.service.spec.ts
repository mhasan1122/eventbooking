import { HttpStatus } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { BookingsService, BOOKING_QUEUE } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';

describe('BookingsService', () => {
  let service: BookingsService;

  const mockQueue = {
    add: jest.fn(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockRepository,
        },
        {
          provide: getQueueToken(BOOKING_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get(BookingsService);
  });

  it('returns 202 and enqueues a new booking', async () => {
    mockRepository.findOne.mockResolvedValue(null);
    mockRepository.create.mockImplementation((data) => ({ id: 1, ...data }));
    mockRepository.save.mockResolvedValue({
      id: 1,
      requestId: 'req-1',
      bookingRef: 'ref-1',
      status: BookingStatus.PENDING,
    });

    const result = await service.create({
      requestId: 'req-1',
      eventId: 1,
      customerName: 'Alice',
      customerEmail: 'alice@example.com',
      seats: 2,
    });

    expect(result.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(result.status).toBe(BookingStatus.PENDING);
    expect(mockQueue.add).toHaveBeenCalledWith(
      'process-booking',
      { bookingId: 1 },
      expect.objectContaining({ jobId: 'req-1' }),
    );
  });

  it('returns 200 for duplicate requestId without enqueueing', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: 5,
      bookingRef: 'existing-ref',
      status: BookingStatus.CONFIRMED,
    });

    const result = await service.create({
      requestId: 'req-dup',
      eventId: 1,
      customerName: 'Bob',
      customerEmail: 'bob@example.com',
      seats: 1,
    });

    expect(result.statusCode).toBe(HttpStatus.OK);
    expect(result.bookingRef).toBe('existing-ref');
    expect(mockQueue.add).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('handles concurrent duplicate insert via unique constraint', async () => {
    mockRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 9,
        bookingRef: 'race-ref',
        status: BookingStatus.PENDING,
      });

    mockRepository.create.mockImplementation((data) => ({ id: 9, ...data }));
    mockRepository.save.mockRejectedValue(
      new QueryFailedError('', [], { code: '23505' } as never),
    );

    const result = await service.create({
      requestId: 'req-race',
      eventId: 1,
      customerName: 'Carol',
      customerEmail: 'carol@example.com',
      seats: 1,
    });

    expect(result.statusCode).toBe(HttpStatus.OK);
    expect(result.bookingRef).toBe('race-ref');
    expect(mockQueue.add).not.toHaveBeenCalled();
  });
});
