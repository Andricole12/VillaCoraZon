import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  confirmInquiryReservation,
  saveInquiryQuotation,
  updateInquiryStatus,
} from "../actions";
import { AdminShell } from "../admin-shell";
import { DeleteDeclinedInquiryButton } from "./delete-declined-inquiry-button";
import GmailQuotationDraftButton from "./gmail-quotation-draft-button";
import { getGmailConnection, isGmailOAuthConfigured } from "@/lib/gmail";
import { requireAdmin } from "@/lib/supabase/admin";
import { getManilaToday } from "@/lib/dates";
import { HeartMark } from "../../heart-mark";

export const metadata: Metadata = {
  title: "Dashboard | Villa Corazon Events Place",
  robots: { index: false, follow: false },
};

const inquiryStatuses = ["new", "reviewing", "declined"] as const;

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatCreatedAt(value: string) {
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

function formatReservationDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

async function AdminDashboard({
  searchParams,
}: {
  searchParams: PageProps<"/admin">["searchParams"];
}) {
  await connection();
  const { supabase, admin } = await requireAdmin();
  const minDate = getManilaToday();
  const now = new Date();
  const nowIso = now.toISOString();
  const [
    { data: inquiries, error: inquiryError },
    { data: upcomingReservations, error: reservationError },
    { data: balanceReservations, error: balanceError },
    gmailConnection,
    params,
  ] = await Promise.all([
    supabase
      .from("reservation_inquiries")
      .select(
        "inquiry_id, customer_name, contact_number, email, event_type, preferred_date, guest_count, special_request, inquiry_status, created_at, quote_amount, quote_valid_until, quote_notes, reservation_id, venues(venue_name), packages(package_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("reservations")
      .select(
          "reservation_id, reference_code, event_type, start_at, guest_count, reservation_status, total_amount, customers(customer_name), reservation_packages(packages(package_name)), payments(payment_amount, payment_status)",
      )
      .in("reservation_status", ["pending", "confirmed"])
      .gte("start_at", nowIso)
      .order("start_at", { ascending: true })
      .limit(500),
    supabase
      .from("reservations")
      .select("total_amount, payments(payment_amount, payment_status)")
      .neq("reservation_status", "cancelled")
      .limit(500),
    getGmailConnection(admin.admin_id),
    searchParams,
  ]);

  if (inquiryError) {
    console.error("Could not load reservation inquiries:", inquiryError.message);
  }
  if (reservationError) {
    console.error("Could not load upcoming reservations:", reservationError.message);
  }
  if (balanceError) {
    console.error("Could not load reservation balances:", balanceError.message);
  }

  const rows = inquiries ?? [];
  const reservations = upcomingReservations ?? [];
  const newCount = rows.filter((inquiry) => inquiry.inquiry_status === "new").length;
  const reviewingCount = rows.filter(
    (inquiry) => inquiry.inquiry_status === "reviewing",
  ).length;
  const pendingReviewCount = newCount + reviewingCount;
  const confirmedCount = reservations.filter(
    (reservation) => reservation.reservation_status === "confirmed",
  ).length;
  const outstandingBalance = (balanceReservations ?? []).reduce((total, reservation) => {
    const paid = (reservation.payments ?? [])
      .filter((payment) => payment.payment_status === "paid")
      .reduce((sum, payment) => sum + Number(payment.payment_amount), 0);
    return total + Math.max(0, Number(reservation.total_amount) - paid);
  }, 0);
  const reservationReference = Array.isArray(params.reference)
    ? params.reference[0]
    : params.reference;
  const inquiryFeedback = Boolean(
    params.updated ||
      params.update ||
      params.quote ||
      params.confirm ||
      params.delete ||
      params.gmail,
  );

  return (
    <AdminShell adminName={admin.admin_name} adminRole={admin.admin_role}>
      <main className="admin-content admin-overview-content" id="overview">
        <section className="admin-overview-hero" aria-labelledby="admin-overview-title">
          <div className="admin-page-heading">
            <div>
              <p className="eyebrow">VENUE OVERVIEW</p>
              <h1 id="admin-overview-title">Reservations &amp; events</h1>
            </div>
            <span className="admin-record-limit">
              Updated {formatCreatedAt(nowIso)}
            </span>
          </div>
          <figure className="admin-overview-venue">
            <Image
              alt="Reception tables arranged inside an event hall"
              fill
              priority
              sizes="(max-width: 700px) 78px, 130px"
              src="/images/illustrative-reception.jpg"
            />
          </figure>
        </section>

          <div className="admin-summary admin-overview-summary">
            <article className="admin-summary-upcoming">
              <span>Upcoming events</span>
              <strong>{reservationError ? "—" : reservations.length}</strong>
              <small>Pending and confirmed</small>
            </article>
            <article className="admin-summary-confirmed">
              <span>Confirmed</span>
              <strong>{reservationError ? "—" : confirmedCount}</strong>
              <small>Ready to celebrate</small>
            </article>
            <article className="admin-summary-reviewing">
              <span>Pending review</span>
              <strong>{inquiryError ? "—" : pendingReviewCount}</strong>
              <small>Needs attention</small>
            </article>
            <article className="admin-summary-balance">
              <span>Outstanding balance</span>
              <strong>{balanceError ? "—" : formatCurrency(outstandingBalance)}</strong>
              <small>Across active reservations</small>
            </article>
          </div>

          <section className="admin-reservations-panel" aria-label="Upcoming reservations">
            <div className="admin-reservations-panel-header">
              <div>
                <h2>Upcoming reservations</h2>
                <p>Manage inquiries and confirmed events</p>
              </div>
              <div className="admin-reservations-tools">
                <form className="admin-reservation-search" action="/admin/reservations">
                  <label>
                    <span className="visually-hidden">Search clients or reservations</span>
                    <input name="q" type="search" placeholder="Search clients…" />
                  </label>
                  <button type="submit" aria-label="Search reservations">⌕</button>
                </form>
                <nav className="admin-reservation-filters" aria-label="Reservation filters">
                  <Link href="/admin/reservations">All</Link>
                  <Link href="/admin/reservations?status=confirmed">Confirmed</Link>
                  <Link href="/admin/reservations?status=pending">Pending</Link>
                  <a href="#inquiries">Inquiry</a>
                </nav>
              </div>
            </div>

            {reservationError ? (
              <div className="admin-data-error" role="alert">
                <strong>Could not load upcoming reservations.</strong>
                <p>Check that the reservations and core project schema are available in Supabase.</p>
              </div>
            ) : reservations.length === 0 ? (
              <p className="admin-section-empty">No upcoming pending or confirmed reservations.</p>
            ) : (
              <div className="admin-table-wrap admin-upcoming-table-wrap">
                <table className="admin-table admin-upcoming-table">
                  <thead>
                    <tr>
                      <th>Reference / client</th>
                      <th>Date &amp; event</th>
                      <th>Guests</th>
                      <th>Package</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.slice(0, 4).map((reservation) => {
                      const paid = (reservation.payments ?? [])
                        .filter((payment) => payment.payment_status === "paid")
                        .reduce((sum, payment) => sum + Number(payment.payment_amount), 0);
                      const total = Number(reservation.total_amount);
                      const balance = Math.max(0, total - paid);
                      const paidPercent = total > 0
                        ? Math.min(100, Math.round((paid / total) * 100))
                        : 0;
                      const clientName: string =
                        reservation.customers?.[0]?.customer_name ?? "Client";
                      const initials = clientName
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0] ?? "")
                        .join("")
                        .toUpperCase();

                      return (
                        <tr key={reservation.reservation_id}>
                          <td>
                            <div className="admin-client-cell">
                              <span className="admin-client-avatar" aria-hidden="true">{initials}</span>
                              <span>
                                <Link
                                  className="admin-client-link"
                                  href={`/admin/reservations?q=${encodeURIComponent(reservation.reference_code)}`}
                                >
                                  {clientName}
                                </Link>
                                <small>{reservation.reference_code}</small>
                              </span>
                            </div>
                          </td>
                          <td>
                            <strong>{formatReservationDate(reservation.start_at)} · {formatTime(reservation.start_at)}</strong>
                            <small>{reservation.event_type}</small>
                          </td>
                          <td>{reservation.guest_count}</td>
                          <td>
                            <strong>
                              {reservation.reservation_packages?.[0]?.packages?.[0]?.package_name ?? "—"}
                            </strong>
                          </td>
                          <td>
                            <div className="admin-payment-summary">
                              <strong>{formatCurrency(paid)} <small>/ {formatCurrency(total)}</small></strong>
                              <span className="admin-payment-progress" aria-label={`${paidPercent}% paid`}>
                                <span style={{ width: `${paidPercent}%` }} />
                              </span>
                              <small>{balance === 0 ? "Paid in full" : `${formatCurrency(balance)} balance`}</small>
                            </div>
                          </td>
                          <td>
                            <span className={`admin-status-pill admin-status-${reservation.reservation_status}`}>
                              {reservation.reservation_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <details className="admin-inquiry-workspace" id="inquiries" open={inquiryFeedback}>
            <summary>
              <span>
                <strong>Manage incoming inquiries</strong>
                <small>Review requests, prepare quotations, and confirm after deposit verification.</small>
              </span>
              <span className="admin-inquiry-count">{inquiryError ? "—" : rows.length} recent</span>
            </summary>
            <div className="admin-inquiry-workspace-content">
          {params.updated === "1" ? (
            <p className="admin-message admin-message-success" role="status">
              Inquiry status updated.
            </p>
          ) : null}
          {params.update === "failed" ? (
            <p className="admin-message admin-message-error" role="alert">
              We couldn&apos;t update that inquiry. Refresh and try again.
            </p>
          ) : null}
          {params.quote === "saved" ? (
            <p className="admin-message admin-message-success" role="status">
              Quotation saved. Contact the customer to send it; the date is not reserved.
            </p>
          ) : null}
          {params.quote === "invalid" ? (
            <p className="admin-message admin-message-error" role="alert">
              Enter a valid quotation amount and an expiry date that is today or later.
            </p>
          ) : null}
          {params.quote === "failed" ? (
            <p className="admin-message admin-message-error" role="alert">
              We couldn&apos;t save that quotation. Refresh and try again.
            </p>
          ) : null}
          {params.confirm === "success" ? (
            <p className="admin-message admin-message-success" role="status">
              Reservation confirmed
              {reservationReference ? ` (${reservationReference})` : ""}. The deposit
              was recorded and the venue date is now blocked. {reservationReference ? (
                <Link href={`/admin/reservations?q=${encodeURIComponent(reservationReference)}`}>
                  Open reservation
                </Link>
              ) : null}
            </p>
          ) : null}
          {params.confirm === "conflict" ? (
            <p className="admin-message admin-message-error" role="alert">
              Another reservation now overlaps this time slot. No reservation or
              payment was created. Check availability and contact the customer.
            </p>
          ) : null}
          {params.confirm === "invalid" ? (
            <p className="admin-message admin-message-error" role="alert">
              Check the deposit details and make sure both the customer acceptance
              and deposit verification boxes are selected.
            </p>
          ) : null}
          {params.confirm === "ineligible" ? (
            <p className="admin-message admin-message-error" role="alert">
              This inquiry or quotation is no longer eligible for confirmation.
              Check the quote expiry, event date, venue capacity, and package.
            </p>
          ) : null}
          {params.confirm === "failed" ? (
            <p className="admin-message admin-message-error" role="alert">
              We couldn&apos;t confirm the reservation. No partial reservation or
              payment was saved. Please try again or contact support.
            </p>
          ) : null}
          {params.delete === "success" ? (
            <p className="admin-message admin-message-success" role="status">
              Declined inquiry deleted.
            </p>
          ) : null}
          {params.delete === "failed" ? (
            <p className="admin-message admin-message-error" role="alert">
              We couldn&apos;t delete that inquiry. Only declined inquiries can be deleted.
            </p>
          ) : null}
          {params.gmail === "connected" ? (
            <p className="admin-message admin-message-success" role="status">
              Gmail connected. Create a branded quotation draft from the saved quotation below.
            </p>
          ) : null}
          {params.gmail === "setup_required" ? (
            <p className="admin-message admin-message-error" role="alert">
              Gmail OAuth is not configured. Follow the Gmail setup guide in the README first.
            </p>
          ) : null}
          {params.gmail === "denied" || params.gmail === "connect_failed" ? (
            <p className="admin-message admin-message-error" role="alert">
              Gmail could not be connected. Check the Google OAuth setup and try again.
            </p>
          ) : null}
          {params.gmail === "invalid_state" ? (
            <p className="admin-message admin-message-error" role="alert">
              Gmail connection expired or the sign-in session changed. Try connecting again.
            </p>
          ) : null}
          <div className="admin-list-heading" id="inquiry-list">
            <div>
              <p className="eyebrow">UP NEXT</p>
              <h2>Latest inquiries</h2>
            </div>
            <span>{rows.length} shown</span>
          </div>

          {inquiryError ? (
            <div className="admin-data-error" role="alert">
              <strong>Could not load inquiries.</strong>
              <p>
                Confirm the reservation inquiry and quotation migrations have
                been applied in Supabase and that this account has an admin record.
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="admin-empty">
              <span className="admin-empty-mark" aria-hidden="true">
                <HeartMark className="admin-empty-logo" />
              </span>
              <h2>No inquiries yet</h2>
              <p>Customer requests will appear here after they submit the form.</p>
            </div>
          ) : (
            <section className="inquiry-list" aria-label="Latest reservation inquiries">
              {rows.map((inquiry) => (
                <article className="inquiry-card" key={inquiry.inquiry_id}>
                  <div className="inquiry-card-top">
                    <div>
                      <p className="inquiry-submitted">
                        Received {formatCreatedAt(inquiry.created_at)}
                      </p>
                      <h2>{inquiry.customer_name}</h2>
                    </div>
                    <span className={`inquiry-status inquiry-status-${inquiry.inquiry_status}`}>
                      {inquiry.inquiry_status}
                    </span>
                  </div>

                  <div className="inquiry-details">
                    <div>
                      <span>Event</span>
                      <strong>{inquiry.event_type}</strong>
                    </div>
                    <div>
                      <span>Preferred date</span>
                      <strong>{formatEventDate(inquiry.preferred_date)}</strong>
                    </div>
                    <div>
                      <span>Guests</span>
                      <strong>{inquiry.guest_count}</strong>
                    </div>
                    <div>
                      <span>Space</span>
                      <strong>{inquiry.venues?.[0]?.venue_name ?? "Unavailable"}</strong>
                    </div>
                    <div>
                      <span>Package</span>
                      <strong>{inquiry.packages?.[0]?.package_name ?? "Unavailable"}</strong>
                    </div>
                    <div>
                      <span>Contact</span>
                      <strong>
                        <a href={`tel:${inquiry.contact_number}`}>{inquiry.contact_number}</a>
                      </strong>
                    </div>
                    {inquiry.email ? (
                      <div className="inquiry-detail-wide">
                        <span>Email</span>
                        <strong>
                          <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                        </strong>
                      </div>
                    ) : null}
                    {inquiry.special_request ? (
                      <div className="inquiry-detail-wide inquiry-request">
                        <span>Customer note</span>
                        <p>{inquiry.special_request}</p>
                      </div>
                    ) : null}
                  </div>

                  {inquiry.quote_amount !== null ? (
                    <div className="saved-quotation">
                      <div className="saved-quotation-heading">
                        <div>
                          <span>Saved quotation</span>
                          <strong>{formatCurrency(inquiry.quote_amount)}</strong>
                        </div>
                        <div>
                          <span>Valid until</span>
                          <strong>{formatEventDate(inquiry.quote_valid_until!)}</strong>
                        </div>
                        {inquiry.email ? (
                          <GmailQuotationDraftButton
                            connectedEmail={gmailConnection?.email ?? null}
                            inquiryId={inquiry.inquiry_id}
                            oauthConfigured={isGmailOAuthConfigured()}
                          />
                        ) : null}
                      </div>
                      {inquiry.quote_notes ? (
                        <p className="saved-quotation-notes">{inquiry.quote_notes}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {inquiry.inquiry_status === "quoted" &&
                  inquiry.quote_amount !== null &&
                  inquiry.reservation_id === null ? (
                    <form
                      className="confirm-reservation-form"
                      action={confirmInquiryReservation}
                    >
                      <input type="hidden" name="inquiryId" value={inquiry.inquiry_id} />
                      <h3>Confirm after acceptance and deposit</h3>
                      <p className="confirm-reservation-copy">
                        This records the verified deposit and creates a confirmed
                        reservation. The date will be blocked immediately. Do not
                        submit until the customer has accepted the quotation and
                        staff has verified the payment.
                      </p>
                      <div className="quotation-fields">
                        <label className="form-field">
                          <span>Verified deposit amount (PHP)</span>
                          <input
                            name="depositAmount"
                            type="number"
                            min="0.01"
                            max={inquiry.quote_amount}
                            step="0.01"
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>Payment method</span>
                          <select name="paymentMethod" required defaultValue="">
                            <option value="" disabled>
                              Select payment method
                            </option>
                            <option value="Cash">Cash</option>
                            <option value="GCash">GCash</option>
                            <option value="Maya">Maya</option>
                            <option value="Bank transfer">Bank transfer</option>
                            <option value="Other">Other</option>
                          </select>
                        </label>
                        <label className="form-field quotation-notes-field">
                          <span>Payment reference (optional)</span>
                          <input
                            name="paymentReference"
                            type="text"
                            maxLength={100}
                            placeholder="Receipt or transaction reference"
                          />
                        </label>
                      </div>
                      <div className="confirm-checks">
                        <label>
                          <input
                            name="customerAcceptedQuote"
                            type="checkbox"
                            required
                          />
                          <span>I confirmed the customer accepted this quotation.</span>
                        </label>
                        <label>
                          <input name="depositVerified" type="checkbox" required />
                          <span>I verified receipt of this deposit.</span>
                        </label>
                      </div>
                      <button className="button button-navy" type="submit">
                        Record deposit and confirm <span aria-hidden="true">→</span>
                      </button>
                    </form>
                  ) : null}

                  {inquiry.inquiry_status !== "declined" &&
                  inquiry.inquiry_status !== "converted" ? (
                    <form className="quotation-form" action={saveInquiryQuotation}>
                      <input type="hidden" name="inquiryId" value={inquiry.inquiry_id} />
                      <h3>
                        {inquiry.quote_amount !== null
                          ? "Update quotation"
                          : "Prepare a quotation"}
                      </h3>
                      <div className="quotation-fields">
                        <label className="form-field">
                          <span>Total amount (PHP)</span>
                          <input
                            name="quoteAmount"
                            type="number"
                            min="0.01"
                            max="99999999.99"
                            step="0.01"
                            defaultValue={inquiry.quote_amount ?? ""}
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>Valid until</span>
                          <input
                            name="quoteValidUntil"
                            type="date"
                            min={minDate}
                            defaultValue={inquiry.quote_valid_until ?? ""}
                            required
                          />
                        </label>
                        <label className="form-field quotation-notes-field">
                          <span>Quotation details (optional)</span>
                          <textarea
                            name="quoteNotes"
                            rows={3}
                            maxLength={2000}
                            defaultValue={inquiry.quote_notes ?? ""}
                            placeholder="What is included in this quotation?"
                          />
                        </label>
                      </div>
                      <button className="button button-navy" type="submit">
                        Save and mark quoted <span aria-hidden="true">→</span>
                      </button>
                    </form>
                  ) : null}

                  <form className="inquiry-status-form" action={updateInquiryStatus}>
                    <input type="hidden" name="inquiryId" value={inquiry.inquiry_id} />
                    <label>
                      <span>Update status</span>
                      <select
                        name="status"
                        defaultValue={
                          inquiry.inquiry_status === "quoted"
                            ? "declined"
                            : inquiry.inquiry_status
                        }
                      >
                        {(inquiry.inquiry_status === "quoted"
                          ? (["declined"] as const)
                          : inquiryStatuses
                        ).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="button button-navy" type="submit">
                      Save status
                    </button>
                  </form>
                  {inquiry.inquiry_status === "declined" ? (
                    <DeleteDeclinedInquiryButton inquiryId={inquiry.inquiry_id} />
                  ) : null}
                </article>
              ))}
            </section>
          )}
            </div>
          </details>
      </main>
    </AdminShell>
  );
}

export default function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <main className="admin-content">
          Loading staff workspace...
        </main>
      }
    >
      <AdminDashboard searchParams={searchParams} />
    </Suspense>
  );
}
