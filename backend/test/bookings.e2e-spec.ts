import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Job } from 'bullmq';
import { AppModule } from '../src/app.module';
import { BOOKING_QUEUE } from '../src/bookings/bookings.service';
import { BookingProcessor } from '../src/bookings/booking.processor';
import { Booking, BookingStatus } from '../src/bookings/entities/booking.entity';
import { Event } from '../src/events/entities/event.entity';

const E2E_PREFIX = 'e2e-test-';

async function waitForBookingStatus(
  bookingRepo: Repository<Booking>,
  bookingRef: string,
  expectedStatus: BookingStatus,
  timeoutMs = 5000,
): Promise<Booking> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const booking = await bookingRepo.findOne({ where: { bookingRef } });
    if (booking?.status === expectedStatus) {
      return booking;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const latest = await bookingRepo.findOne({ where: { bookingRef } });
  throw new Error(
    `Booking ${bookingRef} stayed ${latest?.status ?? 'missing'}; expected ${expectedStatus}`,
  );
}

describe('Bookings API (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let bookingRepo: Repository<Booking>;
  let testEventId: number;
  let initialRemainingSeats: number;

  jest.setTimeout(30_000);

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const processor = moduleFixture.get(BookingProcessor);
    const queue = moduleFixture.get(getQueueToken(BOOKING_QUEUE));
    jest.spyOn(queue, 'add').mockImplementation(async (_name, data) => {
      await processor.process({ data } as Job<{ bookingId: number }>);
    });

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    bookingRepo = dataSource.getRepository(Booking);

    const eventRepo = dataSource.getRepository(Event);
    const events = await eventRepo.find({ order: { remainingSeats: 'DESC' }, take: 1 });
    if (events.length === 0) {
      throw new Error('No events in database — run npm run seed before e2e tests');
    }

    testEventId = events[0].id;
    initialRemainingSeats = events[0].remainingSeats;

    if (initialRemainingSeats < 5) {
      await eventRepo.update(testEventId, {
        remainingSeats: events[0].totalSeats,
      });
      const refreshed = await eventRepo.findOneOrFail({ where: { id: testEventId } });
      initialRemainingSeats = refreshed.remainingSeats;
    }
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      const eventRepo = dataSource.getRepository(Event);
      await eventRepo.update(testEventId, { remainingSeats: initialRemainingSeats });
      await bookingRepo
        .createQueryBuilder()
        .delete()
        .where('request_id LIKE :prefix', { prefix: `${E2E_PREFIX}%` })
        .execute();
    }
    await app?.close();
    await moduleFixture?.close();
  });

  it('GET /events returns events with remaining seat counts', async () => {
    const response = await request(app.getHttpServer()).get('/events').expect(200);

    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          remainingSeats: expect.any(Number),
          totalSeats: expect.any(Number),
          price: expect.any(String),
        }),
      ]),
    );
  });

  it('POST /bookings returns 202 and processes booking to CONFIRMED', async () => {
    const requestId = `${E2E_PREFIX}confirm-${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        requestId,
        eventId: testEventId,
        customerName: 'E2E Tester',
        customerEmail: 'e2e@example.com',
        seats: 1,
      })
      .expect(202);

    expect(createResponse.body).toMatchObject({
      status: 'PENDING',
      bookingRef: expect.any(String),
      message: 'Booking accepted and is being processed',
    });

    const booking = await waitForBookingStatus(
      bookingRepo,
      createResponse.body.bookingRef,
      BookingStatus.CONFIRMED,
    );

    expect(booking).toMatchObject({
      eventId: testEventId,
      customerName: 'E2E Tester',
      seats: 1,
      status: BookingStatus.CONFIRMED,
    });
  });

  it('POST /bookings with duplicate requestId returns 200 without creating a second booking', async () => {
    const requestId = `${E2E_PREFIX}duplicate-${Date.now()}`;

    const first = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        requestId,
        eventId: testEventId,
        customerName: 'Duplicate Tester',
        customerEmail: 'dup@example.com',
        seats: 1,
      })
      .expect(202);

    const second = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        requestId,
        eventId: testEventId,
        customerName: 'Duplicate Tester',
        customerEmail: 'dup@example.com',
        seats: 1,
      })
      .expect(200);

    expect(second.body.bookingRef).toBe(first.body.bookingRef);
    expect(second.body.message).toBe('Booking already exists');

    const matches = await bookingRepo.find({ where: { requestId } });
    expect(matches).toHaveLength(1);
  });

  it('POST /bookings returns 400 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        requestId: `${E2E_PREFIX}invalid-${Date.now()}`,
        eventId: testEventId,
        customerName: 'Bad Email',
        customerEmail: 'not-an-email',
        seats: 1,
      })
      .expect(400);
  });

  it('GET /bookings supports pagination and status filter', async () => {
    const requestId = `${E2E_PREFIX}filter-${Date.now()}`;

    const created = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        requestId,
        eventId: testEventId,
        customerName: 'Filter Tester',
        customerEmail: 'filter@example.com',
        seats: 1,
      })
      .expect(202);

    await waitForBookingStatus(
      bookingRepo,
      created.body.bookingRef,
      BookingStatus.CONFIRMED,
    );

    const filtered = await request(app.getHttpServer())
      .get('/bookings')
      .query({ eventId: testEventId, status: 'CONFIRMED', page: 1, limit: 5 })
      .expect(200);

    expect(filtered.body).toMatchObject({
      page: 1,
      limit: 5,
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
    expect(filtered.body.data.length).toBeGreaterThan(0);
    expect(
      filtered.body.data.every(
        (booking: { status: string; eventId: number }) =>
          booking.status === 'CONFIRMED' && booking.eventId === testEventId,
      ),
    ).toBe(true);
  });

  it('POST /bookings marks booking FAILED when seats exceed availability', async () => {
    const eventRepo = dataSource.getRepository(Event);
    await eventRepo.update(testEventId, { remainingSeats: 0 });

    const requestId = `${E2E_PREFIX}soldout-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        requestId,
        eventId: testEventId,
        customerName: 'Sold Out Tester',
        customerEmail: 'soldout@example.com',
        seats: 1,
      })
      .expect(202);

    const booking = await waitForBookingStatus(
      bookingRepo,
      createResponse.body.bookingRef,
      BookingStatus.FAILED,
    );

    expect(booking.failReason).toContain('Not enough seats');
  });
});
