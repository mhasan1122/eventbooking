import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { BookingProcessor } from './booking.processor';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Event } from '../events/entities/event.entity';

describe('BookingProcessor', () => {
  let processor: BookingProcessor;

  const mockBookingRepo = {
    findOne: jest.fn(),
  };

  const mockEventRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockBookingQueryBuilder = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockEventQueryBuilder = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockManager = {
    getRepository: jest.fn((entity) => {
      if (entity === Event) {
        return mockEventRepo;
      }
      return {
        createQueryBuilder: jest.fn(() => mockBookingQueryBuilder),
      };
    }),
    save: jest.fn(),
  };

  const mockQueryRunner: Partial<QueryRunner> = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockManager as QueryRunner['manager'],
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockEventRepo.createQueryBuilder.mockReturnValue(mockEventQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingProcessor,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    processor = module.get(BookingProcessor);
  });

  it('skips already confirmed bookings', async () => {
    mockBookingRepo.findOne.mockResolvedValue({
      id: 1,
      status: BookingStatus.CONFIRMED,
    });

    await processor.process({ data: { bookingId: 1 } } as never);

    expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('confirms booking when seats are available', async () => {
    const pendingBooking = {
      id: 2,
      eventId: 1,
      seats: 2,
      status: BookingStatus.PENDING,
    };

    mockBookingRepo.findOne.mockResolvedValue(pendingBooking);
    mockBookingQueryBuilder.getOne.mockResolvedValue(pendingBooking);
    mockEventQueryBuilder.getOne.mockResolvedValue({
      id: 1,
      remainingSeats: 10,
    });

    await processor.process({ data: { bookingId: 2 } } as never);

    expect(mockManager.save).toHaveBeenCalledWith(
      Event,
      expect.objectContaining({ remainingSeats: 8 }),
    );
    expect(mockManager.save).toHaveBeenCalledWith(
      Booking,
      expect.objectContaining({ status: BookingStatus.CONFIRMED }),
    );
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('marks booking failed when not enough seats', async () => {
    const pendingBooking = {
      id: 3,
      eventId: 1,
      seats: 5,
      status: BookingStatus.PENDING,
    };

    mockBookingRepo.findOne.mockResolvedValue(pendingBooking);
    mockBookingQueryBuilder.getOne.mockResolvedValue(pendingBooking);
    mockEventQueryBuilder.getOne.mockResolvedValue({
      id: 1,
      remainingSeats: 2,
    });

    await processor.process({ data: { bookingId: 3 } } as never);

    expect(mockManager.save).toHaveBeenCalledWith(
      Booking,
      expect.objectContaining({
        status: BookingStatus.FAILED,
        failReason: expect.stringContaining('Not enough seats'),
      }),
    );
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });
});
