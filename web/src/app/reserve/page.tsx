import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import InquiryForm from "./inquiry-form";
import { getManilaToday } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Request a quotation | Villa Corazon Events Place",
  description:
    "Share your event details with Villa Corazon Events Place and request a personalized quotation.",
};

async function ReservationForm() {
  await connection();
  return <InquiryForm minDate={getManilaToday()} />;
}

export default function ReservePage() {
  return (
    <main className="reserve-page">
      <header className="site-header reserve-header">
        <Link className="brand" href="/" aria-label="Villa Corazon home">
          <span className="brand-mark" aria-hidden="true">
            VC
          </span>
          <span className="brand-name">
            <strong>VILLA CORAZON</strong>
            <span>EVENTS PLACE</span>
          </span>
        </Link>
        <Link className="text-link reserve-back" href="/">
          <span aria-hidden="true">←</span> Back to the venue
        </Link>
      </header>

      <section className="reserve-main">
        <div className="reserve-heading">
          <p className="eyebrow">LET&apos;S START PLANNING</p>
          <h1>
            Tell us about
            <br />
            your <em>celebration.</em>
          </h1>
          <p>
            Share a few details and our team can check your preferred date and
            prepare a quotation. This request is an inquiry, not a confirmed
            reservation.
          </p>
        </div>

        <div className="reserve-form-wrap">
          <Suspense
            fallback={
              <div className="inquiry-form-loading" role="status">
                Loading reservation form...
              </div>
            }
          >
            <ReservationForm />
          </Suspense>
          <aside className="reserve-note">
            <span className="reserve-note-mark" aria-hidden="true">
              i
            </span>
            <p>
              <strong>Your date is not held yet.</strong> Staff will check
              availability, send a quotation, and confirm the reservation after
              verifying the deposit.
            </p>
          </aside>
        </div>
      </section>

      <footer className="reserve-footer">
        Villa Corazon Events Place <span>·</span> A welcoming place to gather
      </footer>
    </main>
  );
}
