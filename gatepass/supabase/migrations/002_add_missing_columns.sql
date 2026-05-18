-- ============================================================
-- Migration 002: Add missing columns and payments table
-- ============================================================

-- Add venue to events (referenced throughout the app but missing from schema)
alter table events
  add column if not exists venue text;

-- Add attendee_phone to registrations
alter table registrations
  add column if not exists attendee_phone text;

-- Add Razorpay tracking columns to registrations
alter table registrations
  add column if not exists razorpay_order_id   text unique,
  add column if not exists razorpay_payment_id text unique;

-- Create payments table (referenced by webhook handler)
create table if not exists payments (
  id                   uuid primary key default gen_random_uuid(),
  registration_id      uuid not null references registrations(id) on delete cascade,
  razorpay_order_id    text not null,
  razorpay_payment_id  text,
  amount               integer not null, -- in paise
  status               payment_status not null default 'pending',
  webhook_payload      jsonb,
  created_at           timestamptz not null default now()
);

alter table payments enable row level security;

-- Organizers can read payments for their events
create policy "Payments: organizer read"
  on payments for select
  using (
    exists (
      select 1 from registrations r
      join events e on e.id = r.event_id
      where r.id = payments.registration_id
        and e.organizer_id = auth.uid()
    )
  );
