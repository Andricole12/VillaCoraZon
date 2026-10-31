alter table public.reservation_inquiries
  add column inquiry_reference_code varchar(16);

update public.reservation_inquiries
set inquiry_reference_code =
  'VCI-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12))
where inquiry_reference_code is null;

alter table public.reservation_inquiries
  alter column inquiry_reference_code set not null;

alter table public.reservation_inquiries
  alter column inquiry_reference_code set default
    ('VCI-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12)));

alter table public.reservation_inquiries
  add constraint reservation_inquiries_reference_code_unique
  unique (inquiry_reference_code);

create or replace function public.track_reservation_inquiry(
  p_code text,
  p_contact text
)
returns table (
  reference_code varchar,
  inquiry_status text,
  event_type varchar,
  preferred_date date,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.inquiry_reference_code,
    i.inquiry_status,
    i.event_type,
    i.preferred_date,
    i.created_at
  from public.reservation_inquiries i
  where i.inquiry_reference_code = upper(btrim(p_code))
    and (
      lower(i.email) = lower(btrim(p_contact))
      or (
        p_contact !~ '@'
        and regexp_replace(i.contact_number, '[^0-9]', '', 'g')
          = regexp_replace(btrim(p_contact), '[^0-9]', '', 'g')
      )
    );
$$;

revoke all on function public.track_reservation_inquiry(text, text)
  from public, anon, authenticated;
grant execute on function public.track_reservation_inquiry(text, text)
  to anon, authenticated;

create or replace function public.get_public_availability(
  p_venue_id bigint,
  p_package_id bigint,
  p_month date
)
returns table (
  event_date date,
  availability_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_start_time time;
  v_end_time time;
begin
  if p_month is null
    or p_month <> date_trunc('month', p_month)::date
    or p_month < date_trunc('month', (now() at time zone 'Asia/Manila'))::date
    or p_month > (
      date_trunc('month', (now() at time zone 'Asia/Manila')) + interval '24 months'
    )::date
  then
    raise exception 'Invalid availability month';
  end if;

  select p.start_time, p.end_time
  into v_start_time, v_end_time
  from public.venues v
  cross join public.packages p
  where v.venue_id = p_venue_id
    and v.is_available
    and p.package_id = p_package_id
    and p.is_available;

  if not found then
    raise exception 'Unavailable venue or package';
  end if;

  return query
  with dates as (
    select generated.event_date::date as event_date
    from generate_series(
      p_month::timestamp,
      (p_month + interval '1 month - 1 day')::timestamp,
      interval '1 day'
    ) as generated(event_date)
  ),
  requested_slots as (
    select
      d.event_date,
      tstzrange(
        (d.event_date + coalesce(v_start_time, time '00:00')) at time zone 'Asia/Manila',
        (
          case
            when v_start_time is null or v_end_time is null
              then (d.event_date + interval '1 day')::timestamp
            else
              d.event_date
              + v_end_time
              + case when v_end_time <= v_start_time then interval '1 day' else interval '0' end
          end
        ) at time zone 'Asia/Manila',
        '[)'
      ) as requested_range
    from dates d
  )
  select
    s.event_date,
    case
      when exists (
        select 1
        from public.venue_bookings b
        left join public.reservations r on r.reservation_id = b.reservation_id
        where b.venue_id = p_venue_id
          and b.is_active
          and b.during && s.requested_range
          and (
            b.source = 'block'
            or r.reservation_status = 'confirmed'
          )
      ) then 'unavailable'
      when exists (
        select 1
        from public.venue_bookings b
        join public.reservations r on r.reservation_id = b.reservation_id
        where b.venue_id = p_venue_id
          and b.is_active
          and b.during && s.requested_range
          and r.reservation_status = 'pending'
      ) then 'pending'
      else 'available'
    end
  from requested_slots s
  order by s.event_date;
end;
$$;

revoke all on function public.get_public_availability(bigint, bigint, date)
  from public, anon, authenticated;
grant execute on function public.get_public_availability(bigint, bigint, date)
  to anon, authenticated;
