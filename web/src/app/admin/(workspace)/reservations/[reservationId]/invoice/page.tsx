import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "../../../../admin-shell";
import InvoiceEmailTools from "./invoice-email-tools";
import { requireAdmin } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ reservationId: string }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

async function InvoicePage({ params }: Props) {
  await connection();
  const [{ reservationId }, { supabase, admin }] = await Promise.all([
    params,
    requireAdmin(),
  ]);
  if (!/^\d+$/.test(reservationId)) notFound();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select(
      "reservation_id, reference_code, event_type, start_at, end_at, guest_count, reservation_status, total_amount, created_at, customers(customer_name, contact_number, email, address), reservation_venues(venues(venue_name)), reservation_packages(quantity, subtotal, packages(package_name, package_price)), reservation_services(service_description, service_cost, service_providers(provider_name, service_type)), payments(payment_id, payment_date, payment_amount, payment_method, payment_status, reference_number)",
    )
    .eq("reservation_id", Number(reservationId))
    .maybeSingle();

  if (error) {
    console.error("Could not load reservation invoice:", error.message);
    return (
      <AdminShell adminName={admin.admin_name} adminRole={admin.admin_role}>
        <main className="admin-content">
          <div className="admin-data-error" role="alert">
            <strong>Could not load the reservation invoice.</strong>
            <p>Refresh the page. If the problem continues, check the reservation data in Supabase.</p>
            <Link href="/admin/reservations">Back to reservations</Link>
          </div>
        </main>
      </AdminShell>
    );
  }

  if (!reservation || reservation.reservation_status !== "confirmed") {
    notFound();
  }

  const customer = reservation.customers?.[0];
  if (!customer) {
    return (
      <AdminShell adminName={admin.admin_name} adminRole={admin.admin_role}>
        <main className="admin-content">
          <div className="admin-data-error" role="alert">
            <strong>Customer details are missing.</strong>
            <p>The invoice cannot be prepared until this reservation has valid customer information.</p>
            <Link href="/admin/reservations">Back to reservations</Link>
          </div>
        </main>
      </AdminShell>
    );
  }

  const items = [
    ...(reservation.reservation_packages ?? []).map((item) => {
      const quantity = Math.max(1, item.quantity);
      const amount = Number(item.subtotal);
      return {
        description: item.packages?.[0]?.package_name ?? "Event package",
        detail: "Venue and event package",
        quantity,
        unitPrice: amount / quantity,
        amount,
      };
    }),
    ...(reservation.reservation_services ?? []).map((item) => ({
      description:
        item.service_description ||
        item.service_providers?.[0]?.provider_name ||
        item.service_providers?.[0]?.service_type ||
        "Additional service",
      detail: item.service_providers?.[0]?.service_type ?? "Additional service",
      quantity: 1,
      unitPrice: Number(item.service_cost),
      amount: Number(item.service_cost),
    })),
  ];
  const paid = (reservation.payments ?? [])
    .filter((payment) => payment.payment_status === "paid")
    .reduce((sum, payment) => sum + Number(payment.payment_amount), 0);
  const balance = Math.max(0, Number(reservation.total_amount) - paid);

  const invoice = {
    referenceCode: reservation.reference_code,
    invoiceDate: formatDate(reservation.created_at),
    customerName: customer.customer_name,
    contactNumber: customer.contact_number,
    email: customer.email ?? "",
    address: customer.address ?? "",
    eventType: reservation.event_type,
    startAt: formatDateTime(reservation.start_at),
    endAt: formatDateTime(reservation.end_at),
    venue: (reservation.reservation_venues ?? [])
      .flatMap((link) => link.venues ?? [])
      .map((venue) => venue.venue_name)
      .join(", ") || "Venue to be confirmed",
    guestCount: reservation.guest_count,
    total: Number(reservation.total_amount),
    paid,
    balance,
    items,
    paymentDetails: (reservation.payments ?? [])
      .filter((payment) => payment.payment_status === "paid")
      .map((payment) => ({
        date: formatDate(payment.payment_date),
        amount: Number(payment.payment_amount),
        method: payment.payment_method,
        reference: payment.reference_number ?? "",
      })),
  };

  return (
    <AdminShell adminName={admin.admin_name} adminRole={admin.admin_role}>
      <main className="admin-content admin-invoice-page">
        <div className="admin-page-heading admin-invoice-toolbar">
          <div>
            <p className="eyebrow">CONFIRMED RESERVATION</p>
            <h1>Prepare invoice email</h1>
            <p>Review the invoice, edit the email draft, then copy and paste the styled message into your email client.</p>
          </div>
          <Link className="button button-outline" href="/admin/reservations">
            Back to reservations
          </Link>
        </div>
        <InvoiceEmailTools invoice={invoice} />
      </main>
    </AdminShell>
  );
}

export default function AdminInvoicePage(props: Props) {
  return (
    <Suspense fallback={<main className="admin-content">Loading invoice...</main>}>
      <InvoicePage {...props} />
    </Suspense>
  );
}
