-- ============================================================
-- Gatepass: Initial Schema Migration
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type event_status as enum ('draft', 'published', 'completed');
create type registration_status as enum ('pending', 'confirmed', 'waitlisted', 'cancelled');
create type payment_status as enum ('free', 'pending', 'paid');
create type field_type as enum ('text', 'email', 'phone', 'select', 'checkbox');

-- ============================================================
-- TABLES
-- ============================================================

-- profiles: extends auth.users
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- events
create table events (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  title               text not null,
  description         text,
  banner_url          text,
  logo_url            text,
  organizer_id        uuid not null references profiles(id) on delete cascade,
  start_date          timestamptz not null,
  end_date            timestamptz not null,
  registration_start  timestamptz,
  registration_end    timestamptz,
  status              event_status not null default 'draft',
  capacity            integer,
  is_invite_only      boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ticket_types
create table ticket_types (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null,
  description text,
  price       integer not null default 0 check (price >= 0), -- price in paise; 0 = free
  capacity    integer,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- form_fields
create table form_fields (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  label        text not null,
  field_type   field_type not null,
  options      jsonb,
  is_required  boolean not null default false,
  order_index  integer not null default 0
);

-- registrations
create table registrations (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references events(id) on delete cascade,
  ticket_type_id   uuid not null references ticket_types(id) on delete restrict,
  attendee_name    text not null,
  attendee_email   text not null,
  form_data        jsonb not null default '{}',
  status           registration_status not null default 'pending',
  qr_code          text not null unique,
  payment_status   payment_status not null default 'free',
  created_at       timestamptz not null default now()
);

-- Explicit unique index on qr_code (also enforces the unique constraint above)
create unique index registrations_qr_code_idx on registrations(qr_code);

-- check_ins
create table check_ins (
  id               uuid primary key default gen_random_uuid(),
  registration_id  uuid not null references registrations(id) on delete cascade,
  checked_in_at    timestamptz not null default now(),
  checked_in_by    uuid references profiles(id) on delete set null
);

-- ============================================================
-- UPDATED_AT TRIGGER for events
-- ============================================================

create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on events
  for each row execute procedure handle_updated_at();

-- ============================================================
-- WAITLIST PROMOTION TRIGGER
-- When a registration is cancelled, promote the oldest
-- waitlisted registration for the same ticket_type to confirmed.
-- ============================================================

create or replace function promote_waitlist()
returns trigger language plpgsql security definer as $$
declare
  next_registration uuid;
begin
  -- Only act when a registration transitions TO 'cancelled'
  if (new.status = 'cancelled' and old.status is distinct from 'cancelled') then
    -- Find the oldest waitlisted registration for the same ticket type
    select id into next_registration
    from registrations
    where ticket_type_id = new.ticket_type_id
      and status = 'waitlisted'
    order by created_at asc
    limit 1;

    -- Promote it to confirmed
    if next_registration is not null then
      update registrations
      set status = 'confirmed'
      where id = next_registration;
    end if;
  end if;

  return new;
end;
$$;

create trigger waitlist_promotion
  after update of status on registrations
  for each row execute procedure promote_waitlist();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles       enable row level security;
alter table events         enable row level security;
alter table ticket_types   enable row level security;
alter table form_fields    enable row level security;
alter table registrations  enable row level security;
alter table check_ins      enable row level security;

-- ──────────────────────────────────────────────
-- profiles policies
-- ──────────────────────────────────────────────

-- Anyone can read any profile (public info)
create policy "Profiles: public read"
  on profiles for select
  using (true);

-- Users can update only their own profile
create policy "Profiles: owner update"
  on profiles for update
  using (auth.uid() = id);

-- ──────────────────────────────────────────────
-- events policies
-- ──────────────────────────────────────────────

-- Organizer has full CRUD on their own events
create policy "Events: owner full access"
  on events for all
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

-- Public can read published events
create policy "Events: public read published"
  on events for select
  using (status = 'published');

-- ──────────────────────────────────────────────
-- ticket_types policies
-- ──────────────────────────────────────────────

-- Organizer of the event has full CRUD on ticket types
create policy "TicketTypes: owner full access"
  on ticket_types for all
  using (
    exists (
      select 1 from events
      where events.id = ticket_types.event_id
        and events.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from events
      where events.id = ticket_types.event_id
        and events.organizer_id = auth.uid()
    )
  );

-- Public can read active ticket types for published events
create policy "TicketTypes: public read active"
  on ticket_types for select
  using (
    is_active = true
    and exists (
      select 1 from events
      where events.id = ticket_types.event_id
        and events.status = 'published'
    )
  );

-- ──────────────────────────────────────────────
-- form_fields policies
-- ──────────────────────────────────────────────

-- Organizer full access on form fields for their events
create policy "FormFields: owner full access"
  on form_fields for all
  using (
    exists (
      select 1 from events
      where events.id = form_fields.event_id
        and events.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from events
      where events.id = form_fields.event_id
        and events.organizer_id = auth.uid()
    )
  );

-- Public can read form fields for published events
create policy "FormFields: public read published"
  on form_fields for select
  using (
    exists (
      select 1 from events
      where events.id = form_fields.event_id
        and events.status = 'published'
    )
  );

-- ──────────────────────────────────────────────
-- registrations policies
-- ──────────────────────────────────────────────

-- Attendee can read their own registrations (matched by email)
create policy "Registrations: attendee read own"
  on registrations for select
  using (
    attendee_email = (
      select email from auth.users where id = auth.uid()
    )
  );

-- Organizer can read all registrations for their events
create policy "Registrations: organizer read all"
  on registrations for select
  using (
    exists (
      select 1 from events
      where events.id = registrations.event_id
        and events.organizer_id = auth.uid()
    )
  );

-- Anyone can insert a registration (public registration form)
create policy "Registrations: public insert"
  on registrations for insert
  with check (true);

-- Organizer can update registrations for their events (e.g. cancel, confirm)
create policy "Registrations: organizer update"
  on registrations for update
  using (
    exists (
      select 1 from events
      where events.id = registrations.event_id
        and events.organizer_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────
-- check_ins policies
-- ──────────────────────────────────────────────

-- Only organizers can read check-in records for their events
create policy "CheckIns: organizer read"
  on check_ins for select
  using (
    exists (
      select 1 from registrations r
      join events e on e.id = r.event_id
      where r.id = check_ins.registration_id
        and e.organizer_id = auth.uid()
    )
  );

-- Only organizers can insert check-in records
create policy "CheckIns: organizer insert"
  on check_ins for insert
  with check (
    exists (
      select 1 from registrations r
      join events e on e.id = r.event_id
      where r.id = check_ins.registration_id
        and e.organizer_id = auth.uid()
    )
  );
