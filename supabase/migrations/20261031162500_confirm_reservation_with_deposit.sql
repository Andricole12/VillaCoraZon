alter table public.reservation_inquiries
  add column reservation_id bigint references public.reservations(reservation_id);

create or replace function public.confirm_inquiry_with_deposit(
  p_inquiry_id bigint,
  p_deposit_amount numeric,
  p_payment_method text,
  p_payment_reference text default null,
  p_customer_accepted boolean default false,
  p_deposit_verified boolean default false
)
returns table (reservation_id bigint, reference_code varchar)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id bigint;
  v_inquiry public.reservation_inquiries%rowtype;
  v_venue public.venues%rowtype;
  v_package public.packages%rowtype;
  v_customer_id bigint;
  v_reservation_id bigint;
  v_reference_code varchar(12);
  v_payment_method text;
  v_payment_reference text;
begin
  select a.admin_id
    into v_admin_id
    from public.admins a
   where a.auth_user_id = (select auth.uid());

  if v_admin_id is null then
    raise exception using errcode = '42501', message = 'Staff access is required.';
  end if;

  if p_deposit_amount is null or p_deposit_amount <= 0 then
    raise exception using errcode = '22023', message = 'Enter a deposit greater than zero.';
  end if;

  if p_customer_accepted is distinct from true
     or p_deposit_verified is distinct from true then
    raise exception using errcode = '42501',
      message = 'Customer acceptance and deposit verification are required.';
  end if;

  if p_payment_method is null
     or p_payment_method not in ('Cash', 'GCash', 'Maya', 'Bank transfer', 'Other') then
    raise exception using errcode = '22023', message = 'Choose a valid payment method.';
  end if;

  if p_payment_reference is not null and char_length(btrim(p_payment_reference)) > 100 then
    raise exception using errcode = '22023', message = 'The payment reference is too long.';
  end if;

  select i.*
    into v_inquiry
    from public.reservation_inquiries i
   where i.inquiry_id = p_inquiry_id
     and i.inquiry_status = 'quoted'
     and i.quote_amount is not null
     and i.reservation_id is null
   for update;

  if not found then
    raise exception using errcode = 'P0001',
      message = 'This inquiry has no active quotation or has already been converted.';
  end if;

  if v_inquiry.quote_valid_until < (pg_catalog.now() at time zone 'Asia/Manila')::date then
    raise exception using errcode = 'P0001', message = 'This quotation has expired.';
  end if;

  if v_inquiry.preferred_date < (pg_catalog.now() at time zone 'Asia/Manila')::date then
    raise exception using errcode = 'P0001', message = 'The requested event date has passed.';
  end if;

  if p_deposit_amount > v_inquiry.quote_amount then
    raise exception using errcode = '22023',
      message = 'The deposit cannot be greater than the quotation total.';
  end if;

  select v.*
    into v_venue
    from public.venues v
   where v.venue_id = v_inquiry.venue_id
     and v.is_available;

  if not found then
    raise exception using errcode = 'P0001', message = 'The requested venue is no longer available.';
  end if;

  if v_inquiry.guest_count > v_venue.capacity then
    raise exception using errcode = 'P0001',
      message = 'The guest count exceeds the selected venue capacity.';
  end if;

  select p.*
    into v_package
    from public.packages p
   where p.package_id = v_inquiry.package_id
     and p.is_available;

  if not found or v_package.start_time is null or v_package.end_time is null
     or v_package.end_time <= v_package.start_time then
    raise exception using errcode = 'P0001',
      message = 'The selected package does not have valid event times.';
  end if;

  insert into public.customers (customer_name, contact_number, email)
  values (v_inquiry.customer_name, v_inquiry.contact_number, v_inquiry.email)
  returning customer_id into v_customer_id;

  insert into public.reservations as r (
    customer_id,
    event_type,
    start_at,
    end_at,
    guest_count,
    reservation_status,
    total_amount,
    special_request
  )
  values (
    v_customer_id,
    v_inquiry.event_type,
    ((v_inquiry.preferred_date + v_package.start_time) at time zone 'Asia/Manila'),
    ((v_inquiry.preferred_date + v_package.end_time) at time zone 'Asia/Manila'),
    v_inquiry.guest_count,
    'confirmed',
    v_inquiry.quote_amount,
    v_inquiry.special_request
  )
  returning r.reservation_id, r.reference_code
       into v_reservation_id, v_reference_code;

  insert into public.reservation_venues (reservation_id, venue_id)
  values (v_reservation_id, v_venue.venue_id);

  insert into public.reservation_packages (
    reservation_id, package_id, quantity, subtotal
  )
  values (
    v_reservation_id, v_package.package_id, 1, v_inquiry.quote_amount
  );

  v_payment_method := p_payment_method;
  v_payment_reference := nullif(btrim(p_payment_reference), '');

  insert into public.payments (
    reservation_id,
    payment_amount,
    payment_type,
    payment_method,
    payment_status,
    reference_number,
    recorded_by
  )
  values (
    v_reservation_id,
    p_deposit_amount,
    'deposit',
    v_payment_method,
    'paid',
    v_payment_reference,
    v_admin_id
  );

  update public.reservation_inquiries as i
     set inquiry_status = 'converted',
         reservation_id = v_reservation_id
   where i.inquiry_id = p_inquiry_id;

  return query select v_reservation_id, v_reference_code;
end;
$$;

revoke all on function public.confirm_inquiry_with_deposit(
  bigint, numeric, text, text, boolean, boolean
)
  from public, anon;
grant execute on function public.confirm_inquiry_with_deposit(
  bigint, numeric, text, text, boolean, boolean
)
  to authenticated;
