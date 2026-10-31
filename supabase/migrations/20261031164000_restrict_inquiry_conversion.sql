drop policy if exists "admins can update reservation inquiries"
  on public.reservation_inquiries;

create policy "admins can update reservation inquiries"
  on public.reservation_inquiries
  for update
  to authenticated
  using (public.is_admin())
  with check (
    public.is_admin()
    and inquiry_status <> 'converted'
  );

revoke update on public.reservation_inquiries from authenticated;
grant update (
  inquiry_status,
  quote_amount,
  quote_valid_until,
  quote_notes,
  quoted_at,
  quoted_by
) on public.reservation_inquiries to authenticated;
