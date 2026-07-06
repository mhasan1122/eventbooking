# Event Booking System — Backend

A production-minded NestJS backend for an Event Booking System with PostgreSQL and Redis/BullMQ.

## Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Framework  | NestJS (TypeScript)                |
| ORM        | TypeORM                            |
| Database   | PostgreSQL                         |
| Queue      | BullMQ + Redis                     |
| Validation | class-validator + class-transformer |

## Setup & Running

### Prerequisites
- Node.js 18+
- PostgreSQL (database named `booking`, password `1234`)
- Redis (running on `localhost:6379`)

### Install & Start

```bash
cp .env.example .env   # adjust DB/Redis credentials if needed
npm install
npm run migration:run  # Create tables (run once)
npm run seed           # Seed 3 sample events
npm run start:dev      # Start in watch mode
```

API runs at: **http://localhost:3001**

## API Endpoints

### GET /events
Returns all events with remaining seat counts.

```json
{
  "data": [
    {
      "id": 1,
      "name": "Taylor Swift: The Eras Tour",
      "date": "2025-09-15T19:00:00.000Z",
      "totalSeats": 100,
      "remainingSeats": 98,
      "price": "250.00"
    }
  ],
  "total": 3
}
```

### POST /bookings
Accepts a booking request. Responds immediately with **202 Accepted** and a booking reference. Processing happens asynchronously via Redis queue.

**Request:**
```json
{
  "requestId": "7f3c2a10-9b1e-4d5a-8c6f-booking-001",
  "eventId": 1,
  "customerName": "Rahim Uddin",
  "customerEmail": "rahim@example.com",
  "seats": 2
}
```

**Response (202 Accepted):**
```json
{
  "bookingRef": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "message": "Booking accepted and is being processed"
}
```

### GET /bookings
Returns a paginated list of bookings. Supports filtering by `eventId` and `status`.

**Query params:** `?page=1&limit=10&eventId=1&status=CONFIRMED`

**Response:**
```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

## How Overbooking Is Prevented

When the BullMQ queue worker picks up a booking job, it uses a **PostgreSQL row-level lock** (`SELECT ... FOR UPDATE`) inside a transaction:

1. `BEGIN TRANSACTION`
2. `SELECT * FROM events WHERE id = ? FOR UPDATE` — exclusively locks the event row
3. Check `remaining_seats >= requested_seats`
4. If **yes**: `UPDATE events SET remaining_seats = remaining_seats - seats`, mark booking as `CONFIRMED`
5. If **no**: mark booking as `FAILED` with reason `"Not enough seats"`
6. `COMMIT`

This guarantees that even if dozens of booking jobs run concurrently, each one must acquire the exclusive row lock before checking or modifying seat counts. Total confirmed seats **never exceed** the available seats because:
- Only one transaction can hold the lock at a time
- Each transaction reads the *current* (post-commit) seat count from the previous transaction
- The check-then-update is atomic within the locked transaction

## How Duplicate Requests Are Handled

Each booking request carries a client-generated `requestId`. This field has a **database-level UNIQUE constraint** on the `bookings` table.

Flow:
1. Before creating a new booking, check if a booking with the same `requestId` already exists
2. If **found**: return the existing `bookingRef` with status `200 OK` — no new booking or queue job created
3. If **not found**: create a `PENDING` booking row and enqueue the job

Additionally, BullMQ's `jobId` is set to the `requestId`, ensuring the same job cannot be enqueued twice into Redis.

If two requests with the same `requestId` arrive simultaneously, the second insert hits the `UNIQUE` constraint; the service catches that error and returns the existing booking with **200 OK**.

## Database Schema

Tables are created via SQL migration (`npm run migration:run`), not auto-sync. The `events` table has a check constraint ensuring `remaining_seats` never goes negative or exceeds `total_seats`.

## Tests

```bash
npm test
```

Covers booking idempotency and queue processor seat confirmation/failure logic.

## Booking Statuses

| Status      | Meaning                                        |
|-------------|------------------------------------------------|
| `PENDING`   | Booking accepted, awaiting queue processing    |
| `CONFIRMED` | Seats reserved successfully                    |
| `FAILED`    | Processing failed (sold out, event not found)  |
