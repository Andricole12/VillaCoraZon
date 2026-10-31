drop policy if exists "admin all admins" on public.admins;

revoke insert, update, delete on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

create policy "admins can read own profile"
  on public.admins
  for select
  to authenticated
  using (auth_user_id = (select auth.uid()));
