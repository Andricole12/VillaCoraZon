create table public.reservation_inquiries (
  inquiry_id bigint generated always as identity primary key,
  customer_name varchar(100) not null
    check (char_length(btrim(customer_name)) between 2 and 100),
  contact_number varchar(20) not null
    check (char_length(btrim(contact_number)) between 7 and 20),
  email varchar(254)
    check (email is null or char_length(btrim(email)) between 3 and 254),
  event_type varchar(100) not null
    check (char_length(btrim(event_type)) between 1 and 100),
  preferred_date date not null,
  guest_count int not null check (guest_count between 1 and 1000),
  venue_id bigint not null references public.venues(venue_id),
  package_id bigint not null references public.packages(package_id),
  special_request text
    check (special_request is null or char_length(special_request) <= 2000),
  inquiry_status text not null default 'new'
    check (inquiry_status in ('new', 'reviewing', 'quoted', 'declined', 'converted')),
  created_at timestamptz not null default now()
);

create index reservation_inquiries_status_created_idx
  on public.reservation_inquiries (inquiry_status, created_at desc);
create index reservation_inquiries_preferred_date_idx
  on public.reservation_inquiries (preferred_date);

alter table public.reservation_inquiries enable row level security;

revoke all on public.reservation_inquiries from anon, authenticated;
grant insert on public.reservation_inquiries to anon, authenticated;
grant select on public.reservation_inquiries to authenticated;
grant usage on sequence public.reservation_inquiries_inquiry_id_seq to anon, authenticated;

create policy "public can submit reservation inquiries"
  on public.reservation_inquiries
  for insert
  to anon, authenticated
  with check (
    inquiry_status = 'new'
    and preferred_date >= (now() at time zone 'Asia/Manila')::date
    and exists (
      select 1
      from public.venues
      where venues.venue_id = reservation_inquiries.venue_id
        and venues.is_available
    )
    and exists (
      select 1
      from public.packages
      where packages.package_id = reservation_inquiries.package_id
        and packages.is_available
    )
  );

create policy "admins can read reservation inquiries"
  on public.reservation_inquiries
  for select
  to authenticated
  using (public.is_admin());
