import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateReservation } from "../../../../actions";
import { AdminShell } from "../../../../admin-shell";
import { requireAdmin } from "@/lib/supabase/admin";
import { getManilaToday } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Edit reservation | Villa Corazon Events Place",
  robots: { index: false, follow: false },
};

function toManilaDateTimeLocal(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const errorMessages: Record<string, string> = {
  invalid: "Check the event details and make sure the new start time is in the future.",
  conflict: "That time overlaps another active reservation or venue block. No changes were saved.",
  failed: "We couldn't update this reservation. Please try again.",
  unavailable: "This reservation can no longer be edited because it is not pending or confirmed.",
};

type Props = {
  params: Promise<{ reservationId: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
};

async function EditReservationPage({
  params,
  searchParams,
}: Props) {
  await connection();
  const [{ reservationId }, query, { supabase, admin }] = await Promise.all([
    params,
    searchParams,
    requireAdmin(),
  ]);
  const id = Number(reservationId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select(
      "reservation_id, reference_code, event_type, start_at, end_at, guest_count, reservation_status, special_request, customers(customer_name)",
    )
    .eq("reservation_id", id)
    .in("reservation_status", ["pending", "confirmed"])
    .maybeSingle();

  if (error) {
    console.error("Could not load reservation for editing:", error.message);
    return (
      <AdminShell adminName={admin.admin_name} adminRole={admin.admin_role}>
        <main className="admin-content">
          <div className="admin-data-error" role="alert">
            <strong>Could not load this reservation.</strong>
            <p>Please refresh and try again. Contact support if the problem continues.</p>
          </div>
        </main>
      </AdminShell>
    );
  }

  if (!reservation) notFound();

  const errorCode = firstParam(query.error) ?? "";
  const errorMessage = errorMessages[errorCode];

  return (
    <AdminShell adminName={admin.admin_name} adminRole={admin.admin_role}>
      <main className="admin-content admin-reservation-edit">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">BOOKING MANAGEMENT</p>
            <h1>Edit reservation</h1>
            <p>
              {reservation.reference_code} · {reservation.customers?.[0]?.customer_name ?? "Client"}
            </p>
          </div>
          <Link className="admin-table-action-link" href="/admin/reservations">
            ← Back to reservations
          </Link>
        </div>

        {errorMessage ? (
          <p className="admin-message admin-message-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <form className="admin-reservation-edit-form" action={updateReservation}>
          <input type="hidden" name="reservationId" value={reservation.reservation_id} />
          <label className="form-field">
            <span>Event type</span>
            <input
              autoComplete="off"
              defaultValue={reservation.event_type}
              maxLength={100}
              name="eventType"
              required
            />
          </label>
          <label className="form-field">
            <span>Reservation status</span>
            <input readOnly value={reservation.reservation_status} />
          </label>
          <label className="form-field">
            <span>Starts</span>
            <input
              defaultValue={toManilaDateTimeLocal(reservation.start_at)}
              min={`${getManilaToday()}T00:00`}
              name="startAt"
              required
              type="datetime-local"
            />
          </label>
          <label className="form-field">
            <span>Ends</span>
            <input
              defaultValue={toManilaDateTimeLocal(reservation.end_at)}
              min={`${getManilaToday()}T00:00`}
              name="endAt"
              required
              type="datetime-local"
            />
          </label>
          <label className="form-field">
            <span>Guest count</span>
            <input
              defaultValue={reservation.guest_count}
              max={1000}
              min={1}
              name="guestCount"
              required
              type="number"
            />
          </label>
          <label className="form-field admin-reservation-edit-notes">
            <span>Special requests</span>
            <textarea
              defaultValue={reservation.special_request ?? ""}
              maxLength={2000}
              name="specialRequest"
              rows={4}
            />
          </label>
          <p className="admin-reservation-edit-note">
            Times use the Philippines time zone. Changes are saved only if the venue remains
            available for the full event period.
          </p>
          <div className="admin-reservation-edit-actions">
            <Link className="admin-header-link" href="/admin/reservations">
              Cancel
            </Link>
            <button className="button button-navy" type="submit">
              Save reservation changes
            </button>
          </div>
        </form>
      </main>
    </AdminShell>
  );
}

export default function AdminEditReservationPage(props: Props) {
  return (
    <Suspense fallback={<main className="admin-content">Loading reservation...</main>}>
      <EditReservationPage {...props} />
    </Suspense>
  );
}
