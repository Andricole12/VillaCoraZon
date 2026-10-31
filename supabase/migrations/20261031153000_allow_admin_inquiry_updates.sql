grant update on public.reservation_inquiries to authenticated;

create policy "admins can update reservation inquiries"
  on public.reservation_inquiries
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
