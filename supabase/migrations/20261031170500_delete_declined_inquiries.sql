revoke delete on public.reservation_inquiries from anon, authenticated;
grant delete on public.reservation_inquiries to authenticated;

create policy "admins can delete declined inquiries"
  on public.reservation_inquiries
  for delete
  to authenticated
  using (
    public.is_admin()
    and inquiry_status = 'declined'
  );
