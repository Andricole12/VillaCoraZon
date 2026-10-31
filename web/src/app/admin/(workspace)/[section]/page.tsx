import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  updatePackageAvailability,
  updateServiceProviderStatus,
  updateVenueAvailability,
} from "../../actions";
import { AdminShell } from "../../admin-shell";
import { requireAdmin } from "@/lib/supabase/admin";
import { getManilaToday } from "@/lib/dates";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";

const sections = [
  "reservations",
  "calendar",
  "clients",
  "venues",
  "packages",
  "payments",
  "reports",
  "notifications",
] as const;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function monthDateKey(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function PageHeading({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="admin-page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {aside}
    </div>
  );
}

function DataMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-data-error" role="alert">
      <strong>Could not load this section.</strong>
      <p>{children}</p>
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <p className="admin-section-empty">{children}</p>;
}

function ReservationTable({
  rows,
}: {
  rows: Array<{
    reservation_id: number;
    reference_code: string;
    event_type: string;
    start_at: string;
    end_at: string;
    guest_count: number;
    reservation_status: ReservationStatus;
    total_amount: number;
    created_at: string;
    customers: Array<{ customer_name: string; contact_number: string; email: string | null }> | null;
    reservation_venues: Array<{ venues: Array<{ venue_name: string }> | null }> | null;
    reservation_packages: Array<{ packages: Array<{ package_name: string }> | null }> | null;
    payments: Array<{ payment_amount: number; payment_status: string }> | null;
  }>;
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Reference / client</th>
            <th>Date &amp; event</th>
            <th>Guests</th>
            <th>Venue / package</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((reservation) => {
            const paid = (reservation.payments ?? [])
              .filter((payment) => payment.payment_status === "paid")
              .reduce((sum, payment) => sum + Number(payment.payment_amount), 0);

            return (
              <tr key={reservation.reservation_id}>
                <td>
                  <strong>{reservation.customers?.[0]?.customer_name ?? "Client"}</strong>
                  <small>{reservation.reference_code}</small>
                </td>
                <td>
                  <strong>{formatDateTime(reservation.start_at)}</strong>
                  <small>{reservation.event_type}</small>
                </td>
                <td>{reservation.guest_count}</td>
                <td>
                  <strong>
                    {reservation.reservation_venues?.[0]?.venues?.[0]?.venue_name ?? "—"}
                  </strong>
                  <small>
                    {reservation.reservation_packages?.[0]?.packages?.[0]?.package_name ?? "—"}
                  </small>
                </td>
                <td>
                  <strong>{formatCurrency(paid)} / {formatCurrency(reservation.total_amount)}</strong>
                  <small>{formatCurrency(Math.max(0, Number(reservation.total_amount) - paid))} balance</small>
                </td>
                <td>
                  <span className={`admin-status-pill admin-status-${reservation.reservation_status}`}>
                    {reservation.reservation_status}
                  </span>
                </td>
                <td>
                  {["pending", "confirmed"].includes(reservation.reservation_status) ? (
                    <Link
                      className="admin-table-action-link"
                      href={`/admin/reservations/${reservation.reservation_id}/edit`}
                    >
                      Edit
                    </Link>
                  ) : null}
                  {reservation.reservation_status === "confirmed" ? (
                    <Link
                      className="admin-table-action-link"
                      href={`/admin/reservations/${reservation.reservation_id}/invoice`}
                    >
                      Prepare
                    </Link>
                  ) : null}
                  {reservation.reservation_status !== "pending" &&
                  reservation.reservation_status !== "confirmed" ? (
                    <span aria-label="No actions available">—</span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function AdminSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: SearchParams;
}) {
  await connection();
  const [{ section }, query] = await Promise.all([params, searchParams]);
  if (!sections.includes(section as (typeof sections)[number])) {
    notFound();
  }

  const { supabase, admin } = await requireAdmin();
  const content = await renderSection(section as (typeof sections)[number], supabase, query);
  const updated = firstParam(query.updated) === "1";
  const updateFailed = firstParam(query.update) === "failed";

  return (
    <AdminShell adminName={admin.admin_name} adminRole={admin.admin_role}>
      <main className="admin-content">
        {updated ? <p className="admin-message admin-message-success" role="status">Changes saved.</p> : null}
        {updateFailed ? <p className="admin-message admin-message-error" role="alert">We couldn&apos;t save that change. Refresh and try again.</p> : null}
        {content}
      </main>
    </AdminShell>
  );
}

async function renderSection(
  section: (typeof sections)[number],
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  query: Record<string, string | string[] | undefined>,
) {
  if (section === "reservations") {
    const statusParam = firstParam(query.status);
    const { data, error } = await supabase
      .from("reservations")
      .select(
        "reservation_id, reference_code, event_type, start_at, end_at, guest_count, reservation_status, total_amount, created_at, customers(customer_name, contact_number, email), reservation_venues(venues(venue_name)), reservation_packages(packages(package_name)), payments(payment_amount, payment_status)",
      )
      .order("start_at", { ascending: false })
      .limit(500);

    if (error) {
      return <DataMessage>Confirm the reservations and core project schema exist in Supabase.</DataMessage>;
    }

    const search = (firstParam(query.q) ?? "").trim().toLocaleLowerCase();
    const statuses: ReservationStatus[] = ["pending", "confirmed", "cancelled", "completed"];
    const status = statuses.includes(statusParam as ReservationStatus)
      ? (statusParam as ReservationStatus)
      : "all";
    const rows = (data ?? []).filter((row) => {
      const matchesStatus = status === "all" || row.reservation_status === status;
      const matchesSearch =
        search.length === 0 ||
        [row.reference_code, row.event_type, row.customers?.[0]?.customer_name]
          .some((value) => value?.toLocaleLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });

    return (
      <>
        <PageHeading
          eyebrow="BOOKING MANAGEMENT"
          title="Reservations"
          description="View confirmed and pending events, payment balances, and reservation details."
          aside={<Link className="button button-navy" href="/reserve">New inquiry <span aria-hidden="true">→</span></Link>}
        />
        <form className="admin-filter-bar" action="/admin/reservations">
          <label>
            <span className="visually-hidden">Search reservations</span>
            <input name="q" type="search" defaultValue={firstParam(query.q)} placeholder="Search reference, event, or client..." />
          </label>
          <label>
            <span className="visually-hidden">Filter by reservation status</span>
            <select name="status" defaultValue={status}>
              <option value="all">All statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button className="admin-filter-button" type="submit">Apply filters</button>
          <span>{rows.length} reservations shown</span>
        </form>
        {rows.length ? <ReservationTable rows={rows} /> : <EmptyMessage>No reservations match these filters yet.</EmptyMessage>}
        <p className="admin-section-footnote">Showing up to 500 latest reservations.</p>
      </>
    );
  }

  if (section === "calendar") {
    const today = getManilaToday();
    const currentMonth = today.slice(0, 7);
    const [currentYear, currentMonthNumber] = currentMonth.split("-").map(Number);
    const monthValue = firstParam(query.month) ?? currentMonth;
    const monthMatch = /^(\d{4})-(\d{2})$/.exec(monthValue);
    const year = monthMatch ? Number(monthMatch[1]) : currentYear;
    const month = monthMatch ? Number(monthMatch[2]) : currentMonthNumber;
    const validMonth = year >= 1900 && year <= 2200 && month >= 1 && month <= 12;
    const selectedYear = validMonth ? year : currentYear;
    const selectedMonth = validMonth ? month : currentMonthNumber;
    const firstDay = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
    const rangeStart = new Date(`${monthDateKey(selectedYear, selectedMonth, 1)}T00:00:00+08:00`).toISOString();
    const rangeEnd = new Date(
      `${monthDateKey(selectedYear, selectedMonth + 1, 1)}T00:00:00+08:00`,
    ).toISOString();
    const [{ data, error }] = await Promise.all([
      supabase
        .from("reservations")
        .select("reservation_id, reference_code, event_type, start_at, end_at, reservation_status, customers(customer_name), reservation_venues(venues(venue_name))")
        .in("reservation_status", ["pending", "confirmed"])
        .lt("start_at", rangeEnd)
        .gt("end_at", rangeStart)
        .order("start_at")
        .limit(500),
    ]);

    if (error) {
      return <DataMessage>Confirm reservations and calendar access are available in Supabase.</DataMessage>;
    }

    const daysInMonth = new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();
    const offset = (firstDay.getUTCDay() + 6) % 7;
    const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
    const reservationsByDate = new Map<string, typeof data>();
    for (const reservation of data ?? []) {
      const key = dateKey(reservation.start_at);
      const current = reservationsByDate.get(key) ?? [];
      current.push(reservation);
      reservationsByDate.set(key, current);
    }
    const previousDate = new Date(Date.UTC(selectedYear, selectedMonth - 2, 1));
    const nextDate = new Date(Date.UTC(selectedYear, selectedMonth, 1));
    const previousMonth = `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, "0")}`;
    const nextMonth = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;

    return (
      <>
        <PageHeading
          eyebrow="VENUE SCHEDULE"
          title="Calendar & schedules"
          description="A month view of pending and confirmed reservations by event date."
          aside={
            <div className="admin-calendar-controls">
              <Link className="admin-calendar-arrow" href={`/admin/calendar?month=${previousMonth}`} aria-label="Previous month">‹</Link>
              <strong>{new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "UTC" }).format(firstDay)}</strong>
              <Link className="admin-calendar-arrow" href={`/admin/calendar?month=${nextMonth}`} aria-label="Next month">›</Link>
            </div>
          }
        />
        <div className="admin-calendar-scroll">
          <div className="admin-calendar-grid" role="grid" aria-label="Reservation calendar">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div className="admin-calendar-weekday" role="columnheader" key={day}>{day}</div>
            ))}
            {Array.from({ length: cellCount }, (_, index) => {
              const day = index - offset + 1;
              const inMonth = day >= 1 && day <= daysInMonth;
              const key = inMonth ? monthDateKey(selectedYear, selectedMonth, day) : "";
              const isToday = key === today;
              const events = reservationsByDate.get(key) ?? [];

              return (
                <div className={`admin-calendar-day${inMonth ? "" : " admin-calendar-day-outside"}${isToday ? " admin-calendar-day-today" : ""}`} role="gridcell" key={index}>
                  <span className="admin-calendar-date" aria-current={isToday ? "date" : undefined}>{inMonth ? day : ""}</span>
                  {events.slice(0, 3).map((event) => (
                    <Link className={`admin-calendar-event admin-calendar-event-${event.reservation_status}`} href={`/admin/reservations?q=${encodeURIComponent(event.reference_code)}`} key={event.reservation_id}>
                      <strong>{formatTime(event.start_at)} · {event.customers?.[0]?.customer_name ?? event.event_type}</strong>
                      <small>{event.event_type} · {event.reservation_venues?.[0]?.venues?.[0]?.venue_name ?? "Venue not set"}</small>
                    </Link>
                  ))}
                  {events.length > 3 ? <span className="admin-calendar-more">+{events.length - 3} more</span> : null}
                </div>
              );
            })}
          </div>
        </div>
        {(data ?? []).length === 0 ? <EmptyMessage>No pending or confirmed events in this month.</EmptyMessage> : null}
        <p className="admin-section-footnote">Only pending and confirmed reservations occupy the schedule.</p>
      </>
    );
  }

  if (section === "clients") {
    const { data, error } = await supabase
      .from("customers")
      .select("customer_id, customer_name, contact_number, email, address, created_at, reservations(reservation_id, reservation_status)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      return <DataMessage>Confirm the customer table exists and is readable by staff.</DataMessage>;
    }
    const search = (firstParam(query.q) ?? "").trim().toLocaleLowerCase();
    const rows = (data ?? []).filter((client) =>
      [client.customer_name, client.contact_number, client.email]
        .some((value) => value?.toLocaleLowerCase().includes(search)),
    );

    return (
      <>
        <PageHeading eyebrow="CUSTOMER DIRECTORY" title="Clients" description="Customer contact information and reservation history." />
        <form className="admin-filter-bar" action="/admin/clients">
          <label><span className="visually-hidden">Search clients</span><input name="q" type="search" defaultValue={firstParam(query.q)} placeholder="Search name, phone, or email..." /></label>
          <button className="admin-filter-button" type="submit">Search</button>
          <span>{rows.length} clients shown</span>
        </form>
        {rows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Client</th><th>Contact</th><th>Email</th><th>Reservations</th><th>Added</th></tr></thead>
              <tbody>{rows.map((client) => (
                <tr key={client.customer_id}>
                  <td><strong>{client.customer_name}</strong>{client.address ? <small>{client.address}</small> : null}</td>
                  <td><a href={`tel:${client.contact_number}`}>{client.contact_number}</a></td>
                  <td>{client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : "—"}</td>
                  <td>{client.reservations?.length ?? 0}</td>
                  <td>{formatDate(client.created_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyMessage>No clients match this search yet.</EmptyMessage>}
        <p className="admin-section-footnote">Showing up to 500 latest customer records.</p>
      </>
    );
  }

  if (section === "venues") {
    const { data, error } = await supabase
      .from("venues")
      .select("venue_id, venue_name, capacity, venue_description, venue_rate, venue_image, is_available")
      .order("venue_name");
    if (error) {
      return <DataMessage>Confirm the venue table exists and is readable by staff.</DataMessage>;
    }

    return (
      <>
        <PageHeading eyebrow="SPACE MANAGEMENT" title="Venues" description="Review venue details, guest capacity, and public availability." />
        {(data ?? []).length ? (
          <div className="admin-resource-grid">
            {data?.map((venue) => (
              <article className="admin-resource-card" key={venue.venue_id}>
                <div className="admin-resource-card-heading">
                  <span className="admin-resource-icon" aria-hidden="true">⌂</span>
                  <span className={`admin-status-pill ${venue.is_available ? "admin-status-available" : "admin-status-unavailable"}`}>{venue.is_available ? "Available" : "Unavailable"}</span>
                </div>
                <h2>{venue.venue_name}</h2>
                <p>{venue.venue_description || "No description has been added."}</p>
                <dl><div><dt>Capacity</dt><dd>{venue.capacity} guests</dd></div><div><dt>Base rate</dt><dd>{formatCurrency(venue.venue_rate)}</dd></div></dl>
                <form action={updateVenueAvailability}>
                  <input type="hidden" name="venueId" value={venue.venue_id} />
                  <input type="hidden" name="isAvailable" value={String(!venue.is_available)} />
                  <button className="admin-resource-action" type="submit">{venue.is_available ? "Pause inquiries for venue" : "Make venue available"}</button>
                </form>
              </article>
            ))}
          </div>
        ) : <EmptyMessage>No venues have been added to the venue list.</EmptyMessage>}
      </>
    );
  }

  if (section === "packages") {
    const [{ data: packages, error: packageError }, { data: providers, error: providerError }] = await Promise.all([
      supabase.from("packages").select("package_id, package_name, package_description, package_type, start_time, end_time, package_price, is_available").order("package_id"),
      supabase.from("service_providers").select("provider_id, provider_name, service_type, contact_number, email, is_active").order("provider_name"),
    ]);
    if (packageError || providerError) {
      return <DataMessage>Confirm package and service-provider tables exist in Supabase.</DataMessage>;
    }

    return (
      <>
        <PageHeading eyebrow="OFFERINGS" title="Packages & services" description="Manage rental-package availability and review listed service providers." />
        <h2 className="admin-section-subheading">Rental packages</h2>
        {(packages ?? []).length ? (
          <div className="admin-resource-grid">
            {packages?.map((item) => (
              <article className="admin-resource-card" key={item.package_id}>
                <div className="admin-resource-card-heading">
                  <span className="admin-resource-icon" aria-hidden="true">✦</span>
                  <span className={`admin-status-pill ${item.is_available ? "admin-status-available" : "admin-status-unavailable"}`}>{item.is_available ? "Available" : "Unavailable"}</span>
                </div>
                <h2>{item.package_name}</h2>
                <p>{item.package_description || "No package description has been added."}</p>
                <dl><div><dt>Schedule</dt><dd>{item.start_time && item.end_time ? `${item.start_time.slice(0, 5)} – ${item.end_time.slice(0, 5)}` : "Not set"}</dd></div><div><dt>Listed price</dt><dd>{formatCurrency(item.package_price)}</dd></div></dl>
                <form action={updatePackageAvailability}>
                  <input type="hidden" name="packageId" value={item.package_id} />
                  <input type="hidden" name="isAvailable" value={String(!item.is_available)} />
                  <button className="admin-resource-action" type="submit">{item.is_available ? "Pause package inquiries" : "Make package available"}</button>
                </form>
              </article>
            ))}
          </div>
        ) : <EmptyMessage>No packages have been added.</EmptyMessage>}
        <h2 className="admin-section-subheading">Service providers</h2>
        {(providers ?? []).length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Provider</th><th>Service</th><th>Contact</th><th>Status</th><th></th></tr></thead>
              <tbody>{providers?.map((provider) => (
                <tr key={provider.provider_id}>
                  <td><strong>{provider.provider_name}</strong></td>
                  <td>{provider.service_type}</td>
                  <td>{provider.contact_number ?? provider.email ?? "—"}</td>
                  <td><span className={`admin-status-pill ${provider.is_active ? "admin-status-available" : "admin-status-unavailable"}`}>{provider.is_active ? "Active" : "Inactive"}</span></td>
                  <td><form action={updateServiceProviderStatus}><input type="hidden" name="providerId" value={provider.provider_id} /><input type="hidden" name="isActive" value={String(!provider.is_active)} /><button className="admin-table-action" type="submit">{provider.is_active ? "Deactivate" : "Activate"}</button></form></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyMessage>No service providers have been added.</EmptyMessage>}
      </>
    );
  }

  if (section === "payments") {
    const { data, error } = await supabase
      .from("payments")
      .select("payment_id, payment_date, payment_amount, payment_type, payment_method, payment_status, reference_number, reservations(reference_code, customers(customer_name))")
      .order("payment_date", { ascending: false })
      .limit(500);
    if (error) {
      return <DataMessage>Confirm the payments table exists and is readable by staff.</DataMessage>;
    }

    return (
      <>
        <PageHeading eyebrow="PAYMENT RECORDS" title="Payments" description="Deposits and balances recorded against reservations. Payment records are view-only here." />
        {(data ?? []).length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Date / client</th><th>Reservation</th><th>Type</th><th>Method / reference</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{data?.map((payment) => (
                <tr key={payment.payment_id}>
                  <td><strong>{formatDate(payment.payment_date)}</strong><small>{payment.reservations?.[0]?.customers?.[0]?.customer_name ?? "Client"}</small></td>
                  <td>{payment.reservations?.[0]?.reference_code ?? "—"}</td>
                  <td>{payment.payment_type}</td>
                  <td><strong>{payment.payment_method}</strong><small>{payment.reference_number ?? "No reference provided"}</small></td>
                  <td><strong>{formatCurrency(payment.payment_amount)}</strong></td>
                  <td><span className={`admin-status-pill admin-status-${payment.payment_status}`}>{payment.payment_status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyMessage>No payments have been recorded.</EmptyMessage>}
        <p className="admin-section-footnote">Showing up to 500 latest payment records.</p>
      </>
    );
  }

  if (section === "reports") {
    const { data, error } = await supabase
      .from("reservations")
      .select("reservation_id, start_at, reservation_status, total_amount, payments(payment_amount, payment_status)")
      .order("start_at", { ascending: false })
      .limit(500);
    if (error) {
      return <DataMessage>Confirm reservation and payment data is available in Supabase.</DataMessage>;
    }

    const rows = data ?? [];
    const confirmed = rows.filter((row) => row.reservation_status === "confirmed");
    const pending = rows.filter((row) => row.reservation_status === "pending");
    const collected = rows.reduce((total, row) => total + (row.payments ?? [])
      .filter((payment) => payment.payment_status === "paid")
      .reduce((sum, payment) => sum + Number(payment.payment_amount), 0), 0);
    const booked = rows.reduce((total, row) =>
      ["confirmed", "pending"].includes(row.reservation_status) ? total + Number(row.total_amount) : total, 0);
    const monthly = new Map<string, number>();
    for (const row of rows) {
      if (row.reservation_status !== "confirmed") continue;
      const key = dateKey(row.start_at).slice(0, 7);
      monthly.set(key, (monthly.get(key) ?? 0) + 1);
    }
    const monthlyRows = [...monthly.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 6);
    const highestMonthCount = Math.max(1, ...monthlyRows.map(([, count]) => count));

    return (
      <>
        <PageHeading eyebrow="VENUE PERFORMANCE" title="Reports" description="A summary of reservation and paid-payment records from the latest 500 reservations." />
        <div className="admin-report-cards">
          <article><span>Confirmed events</span><strong>{confirmed.length}</strong></article>
          <article><span>Pending reservations</span><strong>{pending.length}</strong></article>
          <article><span>Booked value</span><strong>{formatCurrency(booked)}</strong></article>
          <article><span>Payments received</span><strong>{formatCurrency(collected)}</strong></article>
        </div>
        <section className="admin-report-panel">
          <div><h2>Confirmed events by month</h2><p>Based on event date for the latest reservation records.</p></div>
          {monthlyRows.length ? (
            <div className="admin-report-bars">
              {monthlyRows.map(([month, count]) => (
                <div className="admin-report-bar-row" key={month}>
                  <strong>{new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`))}</strong>
                  <span className="admin-report-bar-track"><span style={{ width: `${(count / highestMonthCount) * 100}%` }} /></span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          ) : <EmptyMessage>No confirmed events are available to report.</EmptyMessage>}
        </section>
      </>
    );
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("notification_id, notification_message, notification_type, scheduled_at, sent_status, customers(customer_name, contact_number, email), reservations(reference_code)")
    .order("scheduled_at", { ascending: true })
    .limit(500);
  if (error) {
    return <DataMessage>Confirm the notifications table exists and is readable by staff.</DataMessage>;
  }

  return (
    <>
      <PageHeading eyebrow="CUSTOMER COMMUNICATIONS" title="Notifications" description="Review the saved notification schedule and delivery status." />
      <p className="admin-notification-notice">This page displays notification records from the database. Automatic email or SMS delivery is not configured in this project.</p>
      {(data ?? []).length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Scheduled</th><th>Client / reservation</th><th>Type</th><th>Message</th><th>Status</th></tr></thead>
            <tbody>{data?.map((notification) => (
              <tr key={notification.notification_id}>
                <td><strong>{formatDateTime(notification.scheduled_at)}</strong></td>
                <td><strong>{notification.customers?.[0]?.customer_name ?? "Client"}</strong><small>{notification.reservations?.[0]?.reference_code ?? "—"} · {notification.customers?.[0]?.contact_number ?? notification.customers?.[0]?.email ?? "No contact"}</small></td>
                <td>{notification.notification_type.replaceAll("_", " ")}</td>
                <td className="admin-notification-message">{notification.notification_message}</td>
                <td><span className={`admin-status-pill admin-status-${notification.sent_status}`}>{notification.sent_status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <EmptyMessage>No notification records are scheduled.</EmptyMessage>}
      <p className="admin-section-footnote">Showing up to 500 latest notification records.</p>
    </>
  );
}

export default function AdminSectionPage(props: {
  params: Promise<{ section: string }>;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<main className="admin-content">Loading management section...</main>}>
      <AdminSection {...props} />
    </Suspense>
  );
}
