-- =====================================================================
-- Villa Corazon Events Place - Management and Reservation System
-- PostgreSQL schema for Supabase (run in the SQL Editor)
-- Based on the SAAD data dictionary, with additions marked [NEW]
-- =====================================================================

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type reservation_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type payment_type       as enum ('deposit', 'balance');
create type payment_status     as enum ('pending', 'paid', 'failed');
create type package_type       as enum ('day', 'night', 'whole_day');
create type refund_status      as enum ('not_applicable', 'pending', 'processed');
create type quotation_status   as enum ('draft', 'sent', 'accepted', 'declined', 'expired');
create type notification_status as enum ('pending', 'sent', 'failed');

-- ---------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------
create table customers (
  customer_id    bigint generated always as identity primary key,
  customer_name  varchar(100) not null,
  contact_number varchar(20)  not null,
  email          varchar(100),
  address        varchar(255),
  created_at     timestamptz not null default now()
);

-- Admin profile linked to Supabase Auth (passwords live in auth.users, not here)
create table admins (
  admin_id   bigint generated always as identity primary key,
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  admin_name varchar(100) not null,
  email      varchar(100) not null,
  admin_role varchar(50)  not null default 'staff'  -- 'owner' | 'staff'
);

create table venues (
  venue_id          bigint generated always as identity primary key,
  venue_name        varchar(100) not null unique,
  capacity          int not null check (capacity > 0),
  venue_description text,
  venue_rate        numeric(10,2) not null default 0,
  is_available      boolean not null default true,
  venue_image       varchar(255),
  tour_url          varchar(255)   -- [NEW] 360 photo / virtual tour link
);

create table packages (
  package_id          bigint generated always as identity primary key,
  package_name        varchar(100) not null,
  package_description text,
  package_type        package_type not null,
  start_time          time,            -- [NEW] default slot, confirm with owner
  end_time            time,            -- [NEW]
  package_price       numeric(10,2) not null default 0,
  is_available        boolean not null default true
);

create table service_providers (
  provider_id    bigint generated always as identity primary key,
  provider_name  varchar(100) not null,
  service_type   varchar(50)  not null,   -- 'Catering' | 'Lights and Sounds'
  contact_number varchar(20),
  email          varchar(100),
  is_active      boolean not null default true
);

-- ---------------------------------------------------------------------
-- Quotations [NEW] - the real process starts with a quotation
-- ---------------------------------------------------------------------
create table quotations (
  quotation_id  bigint generated always as identity primary key,
  customer_id   bigint not null references customers(customer_id),
  event_type    varchar(100) not null,
  start_at      timestamptz not null,
  end_at        timestamptz not null,
  guest_count   int not null check (guest_count > 0),
  total_amount  numeric(10,2) not null default 0,
  status        quotation_status not null default 'draft',
  valid_until   date,
  notes         text,
  created_at    timestamptz not null default now(),
  check (end_at > start_at)
);

-- ---------------------------------------------------------------------
-- Reservations
-- ---------------------------------------------------------------------
create table reservations (
  reservation_id     bigint generated always as identity primary key,
  reference_code     varchar(12) not null unique
                     default ('VC-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6))),  -- [NEW] for tracking page
  customer_id        bigint not null references customers(customer_id),
  quotation_id       bigint references quotations(quotation_id),     -- [NEW]
  event_type         varchar(100) not null,
  start_at           timestamptz not null,                            -- replaces EventDate + StartTime
  end_at             timestamptz not null,                            -- replaces EndTime
  guest_count        int not null check (guest_count > 0),
  reservation_status reservation_status not null default 'pending',
  total_amount       numeric(10,2) not null default 0,
  special_request    text,
  created_at         timestamptz not null default now(),
  check (end_at > start_at)
);

-- [NEW] A reservation can use several venues (e.g. Grand Hall + Alfresco)
create table reservation_venues (
  reservation_id bigint not null references reservations(reservation_id) on delete cascade,
  venue_id       bigint not null references venues(venue_id),
  primary key (reservation_id, venue_id)
);

create table reservation_packages (
  reservation_package_id bigint generated always as identity primary key,
  reservation_id bigint not null references reservations(reservation_id) on delete cascade,
  package_id     bigint not null references packages(package_id),
  quantity       int not null default 1 check (quantity > 0),
  subtotal       numeric(10,2) not null default 0
);

create table reservation_services (
  reservation_service_id bigint generated always as identity primary key,
  reservation_id      bigint not null references reservations(reservation_id) on delete cascade,
  provider_id         bigint not null references service_providers(provider_id),
  service_description text,
  service_cost        numeric(10,2) not null default 0,
  service_status      varchar(30) not null default 'requested'
);

-- ---------------------------------------------------------------------
-- DOUBLE-BOOKING PREVENTION [NEW]
-- One row per venue per occupied time range. Both reservations and
-- manual blocks (maintenance, walk-in holds) live here, so one
-- constraint covers everything.
-- ---------------------------------------------------------------------
create table venue_bookings (
  venue_booking_id bigint generated always as identity primary key,
  venue_id       bigint not null references venues(venue_id),
  during         tstzrange not null,
  source         varchar(20) not null default 'reservation',  -- 'reservation' | 'block'
  reservation_id bigint references reservations(reservation_id) on delete cascade,
  block_reason   text,
  is_active      boolean not null default true,

  -- No two ACTIVE bookings for the same venue may overlap.
  constraint no_double_booking
    exclude using gist (venue_id with =, during with &&) where (is_active)
);

-- ---------------------------------------------------------------------
-- Payments, cancellations, notifications, audit
-- ---------------------------------------------------------------------
create table payments (
  payment_id       bigint generated always as identity primary key,
  reservation_id   bigint not null references reservations(reservation_id),
  payment_date     date not null default current_date,
  payment_amount   numeric(10,2) not null check (payment_amount > 0),
  payment_type     payment_type not null,
  payment_method   varchar(50) not null,         -- Cash | GCash | Maya | Card ...
  payment_status   payment_status not null default 'pending',
  reference_number varchar(100),                 -- gateway / receipt reference
  recorded_by      bigint references admins(admin_id)  -- null when paid online
);

create table cancellations (
  cancellation_id     bigint generated always as identity primary key,
  reservation_id      bigint not null unique references reservations(reservation_id),
  cancellation_date   date not null default current_date,
  cancellation_reason text,
  deposit_amount      numeric(10,2) not null default 0,
  refund_status        refund_status not null default 'not_applicable',  -- deposit is non-refundable
  processed_by        bigint references admins(admin_id)
);

create table notifications (
  notification_id      bigint generated always as identity primary key,
  reservation_id       bigint not null references reservations(reservation_id) on delete cascade,
  customer_id          bigint not null references customers(customer_id),
  notification_message text not null,
  notification_type    varchar(50) not null,     -- 'reminder_2w' | 'reminder_1d' | 'payment' ...
  scheduled_at         timestamptz not null,
  sent_status          notification_status not null default 'pending'
);

-- [NEW] Change history (reschedules, status changes)
create table status_history (
  history_id     bigint generated always as identity primary key,
  reservation_id bigint not null references reservations(reservation_id) on delete cascade,
  changed_at     timestamptz not null default now(),
  changed_by     bigint references admins(admin_id),
  old_status     reservation_status,
  new_status     reservation_status,
  note           text
);

create index on reservations (start_at);
create index on reservations (reservation_status);
create index on payments (reservation_id);
create index on notifications (scheduled_at) where sent_status = 'pending';

-- ---------------------------------------------------------------------
-- Keep venue_bookings in sync with the reservation
-- ---------------------------------------------------------------------

-- When a reservation_venues row is added, occupy the slot.
-- The exclusion constraint raises an error if it overlaps another booking.
create or replace function occupy_venue() returns trigger
language plpgsql as $$
declare r reservations%rowtype;
begin
  select * into r from reservations where reservation_id = new.reservation_id;
  insert into venue_bookings (venue_id, during, source, reservation_id, is_active)
  values (new.venue_id, tstzrange(r.start_at, r.end_at, '[)'), 'reservation',
          new.reservation_id, r.reservation_status in ('pending', 'confirmed'));
  return new;
end $$;

create trigger trg_occupy_venue
  after insert on reservation_venues
  for each row execute function occupy_venue();

-- When a reservation is cancelled/completed, free (or keep) the slot;
-- when its times change (reschedule), move the slot (re-checks conflicts).
create or replace function sync_reservation_slot() returns trigger
language plpgsql as $$
begin
  update venue_bookings
     set during    = tstzrange(new.start_at, new.end_at, '[)'),
         is_active = new.reservation_status in ('pending', 'confirmed')
   where reservation_id = new.reservation_id;

  if new.reservation_status is distinct from old.reservation_status then
    insert into status_history (reservation_id, old_status, new_status)
    values (new.reservation_id, old.reservation_status, new.reservation_status);
  end if;
  return new;
end $$;

create trigger trg_sync_reservation_slot
  after update of start_at, end_at, reservation_status on reservations
  for each row execute function sync_reservation_slot();

-- ---------------------------------------------------------------------
-- Public availability: expose ONLY taken time ranges, never customer data
-- ---------------------------------------------------------------------
create view public_booked_slots as
  select venue_id, during from venue_bookings where is_active;

-- ---------------------------------------------------------------------
-- Customer tracking lookup: reference code + email or phone
-- (security definer so customers never get direct table access)
-- ---------------------------------------------------------------------
create or replace function track_reservation(p_code text, p_contact text)
returns table (
  reference_code varchar, reservation_status reservation_status,
  event_type varchar, start_at timestamptz, end_at timestamptz,
  guest_count int, total_amount numeric, total_paid numeric, balance numeric
)
language sql security definer set search_path = public as $$
  select r.reference_code, r.reservation_status, r.event_type, r.start_at, r.end_at,
         r.guest_count, r.total_amount,
         coalesce(sum(p.payment_amount) filter (where p.payment_status = 'paid'), 0),
         r.total_amount - coalesce(sum(p.payment_amount) filter (where p.payment_status = 'paid'), 0)
  from reservations r
  join customers c on c.customer_id = r.customer_id
  left join payments p on p.reservation_id = r.reservation_id
  where r.reference_code = upper(trim(p_code))
    and (lower(c.email) = lower(trim(p_contact)) or c.contact_number = trim(p_contact))
  group by r.reservation_id;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security (baseline) - lock everything, open only what's needed
-- ---------------------------------------------------------------------
alter table customers            enable row level security;
alter table admins               enable row level security;
alter table quotations           enable row level security;
alter table reservations         enable row level security;
alter table reservation_venues   enable row level security;
alter table reservation_packages enable row level security;
alter table reservation_services enable row level security;
alter table venue_bookings       enable row level security;
alter table payments             enable row level security;
alter table cancellations        enable row level security;
alter table notifications        enable row level security;
alter table status_history       enable row level security;
alter table venues               enable row level security;
alter table packages             enable row level security;
alter table service_providers    enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where auth_user_id = auth.uid());
$$;

-- Public can read venues and packages (website content)
create policy "public read venues"   on venues   for select using (true);
create policy "public read packages" on packages for select using (is_available);

-- Admins can do everything on every table
do $$
declare t text;
begin
  foreach t in array array[
    'customers','admins','quotations','reservations','reservation_venues',
    'reservation_packages','reservation_services','venue_bookings','payments',
    'cancellations','notifications','status_history','venues','packages','service_providers'
  ] loop
    execute format('create policy "admin all %1$s" on %1$I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- NOTE: the public availability view and track_reservation() are readable by
-- anon through the API; customer booking inserts should go through a server
-- route (Next.js API / Edge Function) using the service role key, never
-- directly from the browser.

-- ---------------------------------------------------------------------
-- Seed data (PLACEHOLDER prices and times - confirm with the owner)
-- ---------------------------------------------------------------------
insert into venues (venue_name, capacity, venue_description, venue_rate) values
  ('Grand Hall',  150, 'Main event hall, 100 to 150 guests',       0),
  ('Alfresco',     50, 'Open-air space, up to 50 guests',          0),
  ('Veranda',      40, 'Veranda area, up to 40 guests',            0),
  ('Guest Room',    4, 'Accommodation room',                       0),
  ('Guest House',  10, 'Guest house accommodation',                0);

insert into packages (package_name, package_description, package_type, start_time, end_time, package_price) values
  ('Day Package',   'Venue rental, daytime',   'day',       '08:00', '17:00', 0),
  ('Night Package', 'Venue rental, evening',   'night',     '18:00', '23:00', 0),
  ('Whole Day',     'Venue rental, all day',   'whole_day', '08:00', '23:00', 0);

insert into service_providers (provider_name, service_type) values
  ('Referred Caterer (TBD)',          'Catering'),
  ('Referred Lights and Sounds (TBD)', 'Lights and Sounds');

-- ---------------------------------------------------------------------
-- Quick conflict test (run after seeding; the 2nd insert should FAIL)
-- ---------------------------------------------------------------------
-- insert into customers (customer_name, contact_number) values ('Test One', '09120000001');
-- insert into reservations (customer_id, event_type, start_at, end_at, guest_count)
--   values (1, 'Birthday', '2026-12-20 18:00+08', '2026-12-20 23:00+08', 80);
-- insert into reservation_venues values (1, 1);   -- Grand Hall: OK
-- insert into reservations (customer_id, event_type, start_at, end_at, guest_count)
--   values (1, 'Wedding',  '2026-12-20 20:00+08', '2026-12-21 00:00+08', 100);
-- insert into reservation_venues values (2, 1);   -- Grand Hall overlap: ERROR