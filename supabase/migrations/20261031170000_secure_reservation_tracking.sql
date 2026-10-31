create or replace function public.track_reservation(p_code text, p_contact text)
returns table (
  reference_code varchar,
  reservation_status public.reservation_status,
  event_type varchar,
  start_at timestamptz,
  end_at timestamptz,
  guest_count int,
  total_amount numeric,
  total_paid numeric,
  balance numeric
)
language sql
security definer
set search_path = ''
as $$
  select
    r.reference_code,
    r.reservation_status,
    r.event_type,
    r.start_at,
    r.end_at,
    r.guest_count,
    r.total_amount,
    coalesce(sum(p.payment_amount) filter (where p.payment_status = 'paid'), 0),
    r.total_amount - coalesce(sum(p.payment_amount) filter (where p.payment_status = 'paid'), 0)
  from public.reservations r
  join public.customers c on c.customer_id = r.customer_id
  left join public.payments p on p.reservation_id = r.reservation_id
  where r.reference_code = upper(btrim(p_code))
    and (
      lower(c.email) = lower(btrim(p_contact))
      or (
        p_contact !~ '@'
        and regexp_replace(c.contact_number, '[^0-9]', '', 'g')
          = regexp_replace(btrim(p_contact), '[^0-9]', '', 'g')
      )
    )
  group by r.reservation_id;
$$;

revoke all on function public.track_reservation(text, text)
  from public, anon, authenticated;
grant execute on function public.track_reservation(text, text)
  to anon, authenticated;
