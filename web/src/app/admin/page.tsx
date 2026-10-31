import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  confirmInquiryReservation,
  saveInquiryQuotation,
  signOutAdmin,
  updateInquiryStatus,
} from "./actions";
import { requireAdmin } from "@/lib/supabase/admin";
import { getManilaToday } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Inquiry dashboard | Villa Corazon Events Place",
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function quotationEmailLink(inquiry: {
  customer_name: string;
  email: string | null;
  event_type: string;
  preferred_date: string;
  quote_amount: number;
  quote_valid_until: string;
  quote_notes: string | null;
  venues: { venue_name: string }[] | null;
}) {
  const subject = `Villa Corazon quotation for your ${inquiry.event_type}`;
  const message = [
    `Hello ${inquiry.customer_name},`,
    "",
    `Thank you for your inquiry about your ${inquiry.event_type} at Villa Corazon Events Place.`,
    `Preferred event date: ${formatEventDate(inquiry.preferred_date)}`,
    `Venue: ${inquiry.venues?.[0]?.venue_name ?? "Villa Corazon Events Place"}`,
    `Quotation total: ${formatCurrency(inquiry.quote_amount)}`,
    `Valid until: ${formatEventDate(inquiry.quote_valid_until)}`,
    inquiry.quote_notes ? `Details: ${inquiry.quote_notes}` : "",
    "",
    "Please contact us to accept this quotation and discuss the next steps. Your date is not reserved until the deposit is verified and the reservation is confirmed by our staff.",
  ]
    .filter(Boolean)
    .join("\n");

  return `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

async function AdminDashboard({
  searchParams,
}: {
  searchParams: PageProps<"/admin">["searchParams"];
}) {
  await connection();
  const { supabase, admin } = await requireAdmin();
  const minDate = getManilaToday();
  const [{ data: inquiries, error }, params] = await Promise.all([
    supabase
      .from("reservation_inquiries")
      .select(
        "inquiry_id, customer_name, contact_number, email, event_type, preferred_date, guest_count, special_request, inquiry_status, created_at, quote_amount, quote_valid_until, quote_notes, reservation_id, venues(venue_name), packages(package_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    searchParams,
  ]);

  if (error) {
    console.error("Could not load reservation inquiries:", error.message);
  }

  const rows = inquiries ?? [];
  const newCount = rows.filter((inquiry) => inquiry.inquiry_status === "new").length;
  const reviewingCount = rows.filter(
    (inquiry) => inquiry.inquiry_status === "reviewing",
  ).length;
  const quotedCount = rows.filter((inquiry) => inquiry.inquiry_status === "quoted").length;
  const reservationReference = Array.isArray(params.reference)
    ? params.reference[0]
    : params.reference;

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <Link className="brand" href="/" aria-label="Villa Corazon home">
          <span className="brand-mark" aria-hidden="true">
            VC
          </span>
          <span className="brand-name">
            <strong>VILLA CORAZON</strong>
            <span>STAFF PORTAL</span>
          </span>
        </Link>
        <div className="admin-header-right">
          <span className="admin-user">
            {admin.admin_name} <small>{admin.admin_role}</small>
          </span>
          <form action={signOutAdmin}>
            <button className="admin-signout" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">STAFF WORKSPACE</p>
            <h1>Reservation <em>inquiries</em></h1>
            <p>Review new event requests and follow up with a quotation.</p>
          </div>
          <span className="admin-record-limit">Latest 100 requests</span>
        </div>

        <div className="admin-summary">
          <article>
            <span>New</span>
            <strong>{newCount}</strong>
          </article>
          <article>
            <span>Being reviewed</span>
            <strong>{reviewingCount}</strong>
          </article>
          <article>
            <span>Quote prepared</span>
            <strong>{quotedCount}</strong>
          </article>
          <article>
            <span>Total shown</span>
            <strong>{rows.length}</strong>
          </article>
        </div>

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
            was recorded and the venue date is now blocked.
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
        {error ? (
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
              VC
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
                        <a
                          className="button button-outline"
                          href={quotationEmailLink(inquiry)}
                        >
                          Email quotation <span aria-hidden="true">↗</span>
                        </a>
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
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

export default function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <main className="admin-dashboard">
          <div className="admin-content">Loading staff workspace...</div>
        </main>
      }
    >
      <AdminDashboard searchParams={searchParams} />
    </Suspense>
  );
}
