# Villa Corazon website

The website is a Next.js App Router project using TypeScript and Tailwind CSS.
Supabase provides the PostgreSQL backend, and Vercel is the recommended host.

## Run locally

From the repository root:

```powershell
npm --prefix web run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a Supabase project and save its database password somewhere secure.
2. In the Supabase SQL Editor, review `supabase/schema.sql` and run it once
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
10. Run `supabase/migrations/20261031170000_secure_reservation_tracking.sql`
   once to limit the public tracking function to reference-code and matching
   contact lookups. Do not rerun it after it succeeds.
11. Run `supabase/migrations/20261031170500_delete_declined_inquiries.sql` once
   to allow staff to permanently delete only declined inquiries. Do not rerun
   it after it succeeds.
12. Run `supabase/migrations/20261031171000_public_inquiry_tracking_and_availability.sql`
   once to add secure inquiry references, contact-verified inquiry tracking,
   and the public date-availability preview. Do not rerun it after it succeeds.
13. Copy `web/.env.example` to `web/.env.local`.
14. In Supabase Project Settings, copy the Project URL and the publishable API
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
14. Restart the dev server and open
   [http://localhost:3000/api/health/supabase](http://localhost:3000/api/health/supabase).
   `{"status":"ok"}` means the app can query the `venues` table. A
   `not_configured` response means the environment variables are missing; a
   query error means the schema or database permissions need attention.

The Supabase client helper is server-only and uses the publishable/anon key.
The inquiry API uses that public key with Row Level Security: visitors can
submit a new inquiry, but cannot read inquiry records. Never expose a
service-role key in the website.

## Branded Gmail quotation drafts

The staff dashboard can create an editable Gmail draft with the quotation's
navy, gold, and purple HTML design already in the message body. Drafts are not
sent automatically. This uses Gmail's API rather than a `mailto:` link.

### Configure Google OAuth

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a
   project, or select the project where you will configure Gmail.
2. Enable the Gmail API: open **APIs & Services → Library**, search for **Gmail
   API**, open it, and select **Enable**.
3. Configure the consent screen in **Google Auth Platform**:
   - Under **Branding**, enter the app name, support email, and developer
     contact email.
   - Under **Audience**, choose **External** for regular Gmail accounts. Leave
     the app in **Testing** while setting it up and add the Gmail account(s)
     that will connect under **Test users**.
   - Under **Data Access**, add the scopes
     `https://www.googleapis.com/auth/gmail.compose` and
     `https://www.googleapis.com/auth/userinfo.email`.
4. Create the OAuth client: open **Google Auth Platform → Clients → Create
   client**, choose **Web application**, and add this under **Authorized
   redirect URIs**:

   ```text
   http://localhost:3000/api/admin/gmail/callback
   ```

   The URI must match exactly, including `http`, port `3000`, and the callback
   path. Click **Create**, then copy the displayed **Client ID** and **Client
   secret**. Never share or commit the client secret.
5. In VS Code, open `web/.env.local`. Keep your existing Supabase values and add
   these Gmail settings. Replace the first two values with the OAuth credentials
   from Google Cloud Console:

   ```text
   GMAIL_CLIENT_ID=your-google-oauth-client-id
   GMAIL_CLIENT_SECRET=your-google-oauth-client-secret
   GMAIL_REDIRECT_URI=http://localhost:3000/api/admin/gmail/callback
   GMAIL_TOKEN_ENCRYPTION_KEY=64-hexadecimal-characters
   ```

   Generate the encryption key in a PowerShell terminal with:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Copy the generated 64-character value after `GMAIL_TOKEN_ENCRYPTION_KEY=`.
   Use a unique key and keep all four Gmail settings private. Do not prefix
   these variables with `NEXT_PUBLIC_`.
6. Save `.env.local` and restart the local app from the repository root:

   ```powershell
   npm --prefix web run dev
   ```

7. Sign in to `/admin` using your staff account, then open the **Inquiries**
   section. Choose **Connect Gmail to create draft** and sign in to a Gmail
   account you added as a test user. Review and approve the requested access.
8. Save a quotation for an inquiry that has a customer email. Choose **Create
   & open branded draft**. Gmail opens an editable draft with the saved quote
   and event details. Review it and click **Send** in Gmail when ready; the
   website does not send it automatically.

The refresh token is encrypted in an HTTP-only cookie and bound to the signed-in
staff account. Disconnect or revoke the app from the Google Account security
settings to remove its Gmail access. Google OAuth apps left in Testing mode can
issue refresh tokens that expire after seven days; publish and complete any
Google verification requirements before relying on this for production.

## Vercel deployment

The production build and lint checks are `npm run build` and `npm run lint`
from the `web` directory. The app uses the standard Next.js build and does not
need a custom Vercel build command, output directory, or `vercel.json`.

1. Push this repository to GitHub, sign in at [Vercel](https://vercel.com/),
   choose **Add New → Project**, and import the repository.
2. Set **Root Directory** to `web` and leave **Framework Preset** set to
   **Next.js**. Leave the install command, build command, and output directory
   at their detected defaults.
3. Under **Environment Variables**, add these required variables:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | The Supabase project URL from **Project Settings → API** |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The project's publishable API key |

   Add them to **Production** and **Preview** if both environments should
   connect to Supabase. Prefer a separate Supabase project for Preview so test
   deployments cannot modify production data. The publishable key is intended
   for browser apps; never add a Supabase `service_role` or secret key to the
   website or a `NEXT_PUBLIC_` variable.
4. Select **Deploy**. Vercel installs dependencies and runs the Next.js
   production build. Later pushes to the connected Git branch trigger new
   deployments.
5. After deployment, open
   `https://<your-deployment-domain>/api/health/supabase`. A response of
   `{"status":"ok"}` confirms the deployed app can query Supabase. A
   `not_configured` response means the required Vercel variables are missing
   from that deployment environment; add them and redeploy. A
   `schema_not_applied` response means the database schema is missing. A query
   error means the database schema or permissions need attention.
6. (Recommended) Add your custom domain in **Project → Settings → Domains**.
   Configure the DNS records Vercel provides, then wait for the domain to
   become valid before using it as the public site URL.

Gmail quotation drafts are optional; the site can deploy and run without Gmail
credentials. To enable them in Production, add `GMAIL_CLIENT_ID`,
`GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`, and
`GMAIL_TOKEN_ENCRYPTION_KEY` as Production environment variables. Set the
redirect URI to the exact HTTPS URL for the deployed domain, for example:

```text
https://your-domain.example/api/admin/gmail/callback
```

Add that exact URL to the Google OAuth client's **Authorized redirect URIs**.
Generate a unique 32-byte encryption key locally with
`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
and use its 64-character hexadecimal output for
`GMAIL_TOKEN_ENCRYPTION_KEY`. Do not reuse the development key or commit any of
these values. If Gmail is enabled for Preview, give Preview its own callback
URL and authorize that exact URL with Google as well. Google OAuth apps left in
Testing mode can issue refresh tokens that expire after seven days.

After changing environment variables in Vercel, redeploy so the new deployment
receives them. Keep `web/.env.local` on your computer only; it is ignored by
Git. Vercel environment variables are configured in the project settings, not
committed to the repository.

## Staff dashboard setup

The staff sign-in page is `/admin/login`; the protected dashboard is `/admin`.
Its sidebar links to reservations, the calendar, clients, venues, packages and
services, payments, reports, and notifications. There is no public staff
sign-up.

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

Only users present in `public.admins` can view the dashboard or update records.
The dashboard uses the signed-in Supabase session and database Row Level
Security; it does not use a service-role key.

The reservations, calendar, clients, payments, and notification sections read
the corresponding Supabase records. Venue and package availability and service
provider active status can be changed from their management sections. Reports
summarize the latest 500 reservation records. Payment history is view-only;
notification records are displayed but automatic email or SMS delivery is not
configured.

## Reservation workflow

The inquiry form and staff quote workflow are implemented:

1. A customer submits event details and a preferred date through `/reserve`.
   The live calendar previews availability for the selected space and package.
   The date remains a request only; staff rechecks it before confirming.
2. The customer receives an inquiry reference code after submission and can
   check the request status from the form using that code and the phone or email
   they provided.
3. Staff reviews the request in `/admin`, checks availability, and saves a
   quotation with an amount, expiry date, and details.
4. Staff sends the quotation manually. If the customer supplied an email, the
   dashboard creates a formatted Gmail draft containing the saved quote, event
   details, and next steps. Staff reviews and sends it from Gmail.
5. After confirming the customer accepted the quote and verifying their deposit,
   staff enters the payment details, checks both confirmations, and submits the
   dashboard form.
6. The system atomically creates the customer, confirmed reservation, venue and
   package links, paid deposit record, venue booking, and inquiry-to-reservation
   link. A double-booking conflict rejects the whole operation.
7. In **Admin → Reservations**, staff can select **Prepare** for a confirmed
   event, review the branded invoice, personalize the confirmation email,
   copy the rich-text email template, and paste it into their email client.
   Staff can also open a prefilled email draft and print/save the invoice as a
   PDF. Email is not sent automatically; the staff member reviews and sends it.
   Staff can use **Edit** for a pending or confirmed reservation to update its
   event details or reschedule it. The database rejects overlapping venue
   bookings and leaves the original reservation unchanged if a conflict occurs.

An inquiry does not hold a venue date. A date is held only after staff verifies
the deposit and confirms a reservation. The system uses the selected package's
configured start/end times in the `Asia/Manila` time zone. Staff should confirm
those times are correct. Confirmation is transactional: if the venue slot
conflicts, neither the reservation nor the payment is recorded. No email is sent
automatically.

Customers can look up an existing reservation at `/track` using its reference
code and the phone number or email on the reservation. The lookup returns event
status and payment totals, but no customer profile or contact details. Apply
the reservation-tracking migration before enabling this page. Add a production
rate limiter or CAPTCHA before publicly promoting customer lookups.

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
4. Add a production-ready rate limiter or CAPTCHA before publicly promoting
   customer inquiry and tracking endpoints.
5. Add payment and notification delivery integrations if automatic delivery
   becomes a requirement.

The reservation inquiry form, customer reservation tracking, staff login,
inquiry review, quotation, deposit-and-confirm workflows, dashboard sections,
and basic payment reports require their listed migrations; staff features also
require an authorized user in `public.admins`. Automated email/SMS
notifications are not connected yet. The project is not deployed to Vercel yet.
