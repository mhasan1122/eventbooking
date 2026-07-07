# Event Booking System

A monorepo Event Booking System: NestJS API with PostgreSQL + Redis/BullMQ for async booking processing, and a React (Next.js) dashboard to view and create bookings.

## Project Structure

```
├── backend/     NestJS API (PostgreSQL, BullMQ)
└── frontend/    Next.js dashboard (React + TypeScript)
```

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** — create a database named `booking`
- **Redis** — running on `localhost:6379`

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env          # adjust credentials if needed
npm install
npm run migration:run         # create tables
npm run seed                  # insert 3 sample events
npm run start:dev             # http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

Open **http://localhost:3000** to use the dashboard.

## API Overview

| Method | Endpoint     | Description                                      |
|--------|--------------|--------------------------------------------------|
| GET    | `/events`    | List events with remaining seat counts           |
| POST   | `/bookings`  | Submit booking → **202 Accepted**, async processing |
| GET    | `/bookings`  | Paginated bookings; filter by `eventId`, `status` |

**Sample booking request:**

```json
POST /bookings
{
  "requestId": "7f3c2a10-9b1e-4d5a-8c6f-booking-001",
  "eventId": 1,
  "customerName": "Rahim Uddin",
  "customerEmail": "rahim@example.com",
  "seats": 2
}
```

See [backend/README.md](./backend/README.md) for full API details.

## Key Design Decisions

### Asynchronous booking flow

`POST /bookings` creates a `PENDING` row and enqueues a BullMQ job, then returns **202** immediately with a `bookingRef`. A worker validates the event, checks availability, deducts seats, and sets status to `CONFIRMED` or `FAILED`.

### Preventing overbooking (concurrency-safe)

The queue worker processes each booking inside a PostgreSQL transaction with **row-level locks** (`SELECT … FOR UPDATE`):

1. Lock the booking row — skip if no longer `PENDING` (idempotent on BullMQ retries)
2. Lock the event row exclusively
3. Check `remaining_seats >= requested_seats`
4. Deduct seats and mark booking `CONFIRMED`, or mark `FAILED` with a reason
5. Commit

Only one transaction can hold the event lock at a time, so concurrent workers never confirm more seats than available. A DB check constraint also ensures `remaining_seats` stays between 0 and `total_seats`.

### Preventing duplicate bookings

Each request carries a client-generated `requestId`:

- **Application layer:** lookup before insert; return existing `bookingRef` with **200 OK**
- **Database layer:** `UNIQUE` constraint on `request_id`; concurrent duplicates catch the violation and return the existing booking
- **Queue layer:** BullMQ `jobId` set to `requestId` so the same job is not enqueued twice

### Retry behavior

BullMQ retries up to 3 times with exponential backoff on unexpected errors. The worker skips bookings that are no longer `PENDING`, so a successful confirmation is never processed twice.

## Database Setup

Schema is applied via SQL migration:

```bash
cd backend && npm run migration:run
```

Sample events are seeded separately:

```bash
cd backend && npm run seed
```

## Tests

```bash
cd backend && npm test          # unit tests
cd backend && npm run test:e2e  # HTTP integration tests (requires Postgres + Redis + seed data)
```

Unit tests cover booking creation idempotency and queue processor seat logic. E2E tests exercise the full HTTP flow: `POST /bookings` → async processing → `GET /bookings` filtering.

## What I Would Improve With More Time

- **Docker Compose** for PostgreSQL + Redis (one-command local setup)
- **Concurrent load test** proving no overbooking under parallel requests
- **GET /bookings/:ref** endpoint for single-booking lookup
- **Synchronous validation** of `eventId` on POST (currently fails async in worker)
- **WebSocket or SSE** instead of polling for status updates on the frontend
- **Rate limiting** and authentication for production use

## License

MIT (assessment project)
