"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";

const responseSchema = z.object({
  reservation: z.object({
    reference_code: z.string(),
    reservation_status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
    event_type: z.string(),
    start_at: z.string(),
    end_at: z.string(),
    guest_count: z.number(),
    total_amount: z.number(),
    total_paid: z.number(),
    balance: z.number(),
  }),
});

type Reservation = z.infer<typeof responseSchema>["reservation"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export default function ReservationLookup() {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReservation(null);
    setFeedback("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      referenceCode: formData.get("referenceCode"),
      contact: formData.get("contact"),
    };

    try {
      const response = await fetch("/api/reservation-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
            ? result.message
            : "We couldn't check your reservation. Please try again.";
        setFeedback(message);
        return;
      }

      const parsed = responseSchema.safeParse(result);
      if (!parsed.success) {
        setFeedback("We couldn't read the reservation details. Please try again.");
        return;
      }

      setReservation(parsed.data.reservation);
    } catch {
      setFeedback("We couldn't reach the reservation service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="track-card">
      <form className="track-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Reservation reference <b>*</b></span>
          <input
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={9}
            name="referenceCode"
            pattern="VC-[A-Fa-f0-9]{6}"
            placeholder="VC-ABC123"
            required
          />
        </label>
        <label className="form-field">
          <span>Phone number or email <b>*</b></span>
          <input
            autoComplete="off"
            maxLength={254}
            name="contact"
            placeholder="Contact used for your reservation"
            required
          />
        </label>
        <button className="button button-navy" disabled={isLoading} type="submit">
          {isLoading ? "Checking reservation..." : "Check reservation"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      {feedback ? (
        <p className="track-feedback track-feedback-error" role="alert">
          {feedback}
        </p>
      ) : null}

      {reservation ? (
        <section className="track-result" aria-live="polite">
          <div className="track-result-heading">
            <div>
              <span>Reservation reference</span>
              <h2>{reservation.reference_code}</h2>
            </div>
            <span className={`admin-status-pill admin-status-${reservation.reservation_status}`}>
              {reservation.reservation_status}
            </span>
          </div>
          <dl className="track-result-details">
            <div>
              <dt>Event</dt>
              <dd>{reservation.event_type}</dd>
            </div>
            <div>
              <dt>Starts</dt>
              <dd>{formatDateTime(reservation.start_at)}</dd>
            </div>
            <div>
              <dt>Ends</dt>
              <dd>{formatDateTime(reservation.end_at)}</dd>
            </div>
            <div>
              <dt>Guests</dt>
              <dd>{reservation.guest_count}</dd>
            </div>
          </dl>
          <div className="track-payment-summary">
            <div>
              <span>Total</span>
              <strong>{formatCurrency(reservation.total_amount)}</strong>
            </div>
            <div>
              <span>Paid</span>
              <strong>{formatCurrency(reservation.total_paid)}</strong>
            </div>
            <div>
              <span>Balance</span>
              <strong>{formatCurrency(reservation.balance)}</strong>
            </div>
          </div>
          <p className="track-result-note">
            For changes or questions about your event, contact Villa Corazon
            using the details provided with your quotation.
          </p>
        </section>
      ) : null}
    </div>
  );
}
