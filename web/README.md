# Villa Corazon website

The website is a Next.js App Router project using TypeScript and Tailwind CSS.
Supabase is the planned PostgreSQL backend, and Vercel is the planned host.

## Run locally

From the repository root:

```powershell
npm --prefix web run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a Supabase project and save its database password somewhere secure.
2. In the Supabase SQL Editor, review the root `schema.sql` and run it once
   against the new, empty project. Do not run it repeatedly: the script creates
   enum types and triggers that are not designed to be reapplied.
3. Before using real customer data, review the SQL policies and the public
   reservation-tracking function. The seed venue/package prices are placeholders
   and need owner-approved values.
4. Since the base schema has already been applied, run
   `supabase/migrations/20261031150500_create_reservation_inquiries.sql` once in
   the Supabase SQL Editor. If the inquiry table already exists, do not rerun
   this migration.
5. Run
   `supabase/migrations/20261031153000_allow_admin_inquiry_updates.sql` once
   to enable authorized staff to change inquiry status. Do not rerun it after
   it succeeds.
6. Run `supabase/migrations/20261031154500_lock_admin_profiles.sql` once to
   prevent dashboard users from granting themselves or others admin access.
   Do not rerun it after it succeeds.
7. Run `supabase/migrations/20261031161000_add_inquiry_quotations.sql` once to
   add quotation fields to inquiries. Do not rerun it after it succeeds.
8. Run `supabase/migrations/20261031162500_confirm_reservation_with_deposit.sql`
   once to add the atomic deposit-and-confirm workflow. Do not rerun it after
   it succeeds.
9. Run `supabase/migrations/20261031164000_restrict_inquiry_conversion.sql`
   once to ensure only the atomic confirmation function can convert an inquiry
   to a reservation. Do not rerun it after it succeeds.
10. Copy `web/.env.example` to `web/.env.local`.
11. In Supabase Project Settings, copy the Project URL and the publishable API
   key into `web/.env.local`:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

   Older projects can use the `anon` key as
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These public API keys are designed for
   browser-facing applications; database access must still be protected by
   correct Row Level Security policies. Never put the `service_role` or secret
   key in a `NEXT_PUBLIC_` variable or browser code.
12. Restart the dev server and open
   [http://localhost:3000/api/health/supabase](http://localhost:3000/api/health/supabase).
   `{"status":"ok"}` means the app can query the `venues` table. A
   `not_configured` response means the environment variables are missing; a
   query error means the schema or database permissions need attention.

The Supabase client helper is server-only and uses the publishable/anon key.
The inquiry API uses that public key with Row Level Security: visitors can
submit a new inquiry, but cannot read inquiry records. Never expose a
service-role key in the website.

## Vercel deployment

1. Push the repository to your GitHub account and import it into Vercel.
2. Set the Vercel project **Root Directory** to `web` and use the detected
   Next.js framework settings.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel's project environment
   variables for Preview and Production.
4. Deploy, then test the live `/api/health/supabase` endpoint.

Keep `web/.env.local` on your computer only. It is ignored by Git. Vercel
environment variables are configured in the Vercel project settings, not
committed to the repository.

## Staff dashboard setup

The staff sign-in page is `/admin/login`; the protected inquiry dashboard is
`/admin`. There is no public staff sign-up.

To authorize the venue owner or a staff member:

1. In Supabase, open **Authentication → Users** and invite the person's email
   or create their account.
2. In the SQL Editor, add a matching row to `public.admins`, replacing the
   example name, email, and role:

   ```sql
   insert into public.admins (auth_user_id, admin_name, email, admin_role)
   select id, 'Venue Owner', email, 'owner'
   from auth.users
   where lower(email) = lower('owner@example.com');
   ```

3. Sign in at `/admin/login` with that Supabase Auth account.

Only users present in `public.admins` can view or update inquiries. The
dashboard uses the signed-in Supabase session and database Row Level Security;
it does not use a service-role key.

## Reservation workflow

The inquiry form and staff quote workflow are implemented:

1. A customer submits event details and a preferred date through `/reserve`.
2. Staff reviews the request in `/admin`, checks availability, and saves a
   quotation with an amount, expiry date, and details.
3. Staff sends the quotation manually (the dashboard can open a prefilled email
   draft if the customer supplied an email).
4. After confirming the customer accepted the quote and verifying their deposit,
   staff enters the payment details, checks both confirmations, and submits the
   dashboard form.
5. The system atomically creates the customer, confirmed reservation, venue and
   package links, paid deposit record, venue booking, and inquiry-to-reservation
   link. A double-booking conflict rejects the whole operation.

An inquiry does not hold a venue date. A date is held only after staff verifies
the deposit and confirms a reservation. The system uses the selected package's
configured start/end times in the `Asia/Manila` time zone. Staff should confirm
those times are correct. Confirmation is transactional: if the venue slot
conflicts, neither the reservation nor the payment is recorded. No email is sent
automatically.

Before sharing the form publicly, add abuse prevention such as a CAPTCHA or a
production-ready rate limiter, and confirm the venue policies and contact
process with the owners.

## Next implementation steps

1. Create the Supabase and Vercel projects and configure their environment
   variables as described above.
2. Confirm venue rates, hours, deposit and cancellation policies, and current
   venue capacities with the owners.
3. Review the schema's public-access policies before applying it to a
   production database.
4. Add reservation/calendar management and customer reservation tracking.
5. Add payment reports and customer notifications.

The reservation inquiry form, staff login, inquiry review, quotation, and
deposit-and-confirm workflows require their listed migrations and an
authorized user in `public.admins`. Live customer availability lookup,
reservation tracking, payment reports, and automated email notifications are
not connected yet. The project is not deployed to Vercel yet.
