import type { Metadata } from "next";
import Link from "next/link";
import ReservationLookup from "./reservation-lookup";

export const metadata: Metadata = {
  title: "Track your reservation | Villa Corazon Events Place",
  description:
    "Check your Villa Corazon reservation status using your reference code and contact details.",
};

export default function TrackReservationPage() {
  return (
    <main className="track-page">
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

      <section className="track-main">
        <div className="track-heading">
          <p className="eyebrow">YOUR CELEBRATION, AT A GLANCE</p>
          <h1>
            Track your <em>reservation.</em>
          </h1>
          <p>
            Use the reference code from your confirmation and the phone number
            or email you gave our team.
          </p>
        </div>
        <ReservationLookup />
        <p className="track-help">
          Still waiting for a quotation? An inquiry does not reserve a date.
          <Link href="/reserve"> Send a reservation inquiry</Link>.
        </p>
      </section>
      <footer className="reserve-footer">
        Villa Corazon Events Place <span>·</span> A welcoming place to gather
      </footer>
    </main>
  );
}
