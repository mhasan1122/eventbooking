# Event Booking API

NestJS backend for the Event Booking System. Bookings are accepted immediately and processed asynchronously via BullMQ.

## Prerequisites

- Node.js 18+
- PostgreSQL (database: `booking`)
- Redis on `localhost:6379`

## Setup

```bash
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev    # http://localhost:3001
```

## Endpoints

### `GET /events`

Returns all events with remaining seat counts.

**Response `200 OK`**

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
  "total": 1
}
```

---

### `POST /bookings`

Submits a booking request. Responds immediately; processing happens in the background.

**Request body**

| Field           | Type   | Required | Rules              |
|-----------------|--------|----------|--------------------|
| `requestId`     | string | yes      | Client-generated, unique per booking attempt |
| `eventId`       | number | yes      | Positive integer   |
| `customerName`  | string | yes      | Max 255 chars      |
| `customerEmail` | string | yes      | Valid email        |
| `seats`         | number | yes      | Integer ≥ 1        |

**Response `202 Accepted`** (new booking)

```json
{
  "bookingRef": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "PENDING",
  "message": "Booking accepted and is being processed"
}
```

**Response `200 OK`** (duplicate `requestId` — idempotent, no second booking created)

```json
{
  "bookingRef": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "CONFIRMED",
  "message": "Booking already exists"
}
```

**Response `400 Bad Request`** (validation error)

```json
{
  "statusCode": 400,
  "message": ["customerEmail must be an email"],
  "error": "Bad Request"
}
```

After processing, booking status becomes:

- `CONFIRMED` — seats deducted successfully
- `FAILED` — e.g. event not found, sold out (`failReason` set on the booking record)

---

### `GET /bookings`

Returns a paginated list of bookings. Supports filtering by event and status.

**Query parameters**

| Param     | Type   | Default | Description                          |
|-----------|--------|---------|--------------------------------------|
| `page`    | number | 1       | Page number (1-based)                |
| `limit`   | number | 10      | Items per page                       |
| `eventId` | number | —       | Filter by event ID                   |
| `status`  | string | —       | `PENDING`, `CONFIRMED`, or `FAILED`  |

**Response `200 OK`**

```json
{
  "data": [
    {
      "id": 1,
      "requestId": "7f3c2a10-9b1e-4d5a-8c6f-booking-001",
      "bookingRef": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "eventId": 1,
      "customerName": "Rahim Uddin",
      "customerEmail": "rahim@example.com",
      "seats": 2,
      "status": "CONFIRMED",
      "failReason": null,
      "createdAt": "2025-07-07T10:00:00.000Z",
      "updatedAt": "2025-07-07T10:00:01.000Z",
      "event": {
        "id": 1,
        "name": "Taylor Swift: The Eras Tour",
        "date": "2025-09-15T19:00:00.000Z",
        "totalSeats": 100,
        "remainingSeats": 98,
        "price": "250.00"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

## Scripts

| Command              | Description                    |
|----------------------|--------------------------------|
| `npm run start:dev`  | Start API with hot reload      |
| `npm run migration:run` | Apply database schema       |
| `npm run seed`       | Insert 3 sample events         |
| `npm test`           | Run unit tests                 |
| `npm run test:e2e`   | Run HTTP integration tests     |

## Architecture notes

- **Queue:** BullMQ (`bookings` queue), 3 retries with exponential backoff
- **Concurrency safety:** `SELECT … FOR UPDATE` inside a transaction when confirming bookings
- **Idempotency:** `UNIQUE(request_id)` + BullMQ `jobId` = `requestId`

See the [root README](../README.md) for full design rationale.
