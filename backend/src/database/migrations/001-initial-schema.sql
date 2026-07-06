-- Initial schema for Event Booking System
-- Run via: npm run migration:run

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date TIMESTAMP NOT NULL,
  total_seats INT NOT NULL CHECK (total_seats > 0),
  remaining_seats INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT events_remaining_seats_valid CHECK (
    remaining_seats >= 0 AND remaining_seats <= total_seats
  )
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(255) NOT NULL,
  booking_ref VARCHAR(36) NOT NULL,
  event_id INT NOT NULL REFERENCES events(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  seats INT NOT NULL CHECK (seats > 0),
  status booking_status NOT NULL DEFAULT 'PENDING',
  fail_reason VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_request_id_unique UNIQUE (request_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
