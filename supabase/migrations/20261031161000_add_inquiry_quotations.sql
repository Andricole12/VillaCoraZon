alter table public.reservation_inquiries
  add column quote_amount numeric(10, 2),
  add column quote_valid_until date,
  add column quote_notes text,
  add column quoted_at timestamptz,
  add column quoted_by bigint references public.admins(admin_id);

alter table public.reservation_inquiries
  add constraint reservation_inquiries_quote_amount_positive
    check (quote_amount is null or quote_amount > 0),
  add constraint reservation_inquiries_quote_notes_length
    check (quote_notes is null or char_length(quote_notes) <= 2000),
  add constraint reservation_inquiries_quote_fields_consistent
    check (
      (
        quote_amount is null
        and quote_valid_until is null
        and quote_notes is null
        and quoted_at is null
        and quoted_by is null
      )
      or (
        quote_amount is not null
        and quote_valid_until is not null
        and quoted_at is not null
        and quoted_by is not null
      )
    );
