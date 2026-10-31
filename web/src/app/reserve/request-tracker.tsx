"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";

const responseSchema = z.object({
  inquiry: z.object({
    reference_code: z.string(),
    inquiry_status: z.enum(["new", "reviewing", "quoted", "declined", "converted"]),
    event_type: z.string(),
    preferred_date: z.string(),
    created_at: z.string(),
  }),
});

type TrackedInquiry = z.infer<typeof responseSchema>["inquiry"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export default function RequestTracker({
  initialReference = "",
  initialContact = "",
}: {
  initialReference?: string;
  initialContact?: string;
}) {
  const [referenceCode, setReferenceCode] = useState(initialReference);
  const [contact, setContact] = useState(initialContact);
  const [inquiry, setInquiry] = useState<TrackedInquiry | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInquiry(null);
    setFeedback("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/request-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ referenceCode, contact }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
            ? result.message
            : "We couldn't check your request. Please try again.";
        setFeedback(message);
        return;
      }

      const parsed = responseSchema.safeParse(result);
      if (!parsed.success) {
        setFeedback("We couldn't read the request details. Please try again.");
        return;
      }

      setInquiry(parsed.data.inquiry);
    } catch {
      setFeedback("We couldn't reach the request tracker. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="request-tracker">
      <div>
        <h2>Already have a request?</h2>
        <p>Enter the reference code from your inquiry confirmation and your phone or email.</p>
      </div>
      <form className="request-tracker-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Request reference</span>
          <input
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={16}
            onChange={(event) => setReferenceCode(event.target.value.toUpperCase())}
            pattern="VCI-[A-Fa-f0-9]{12}"
            placeholder="VCI-ABC123DEF456"
            required
            value={referenceCode}
          />
        </label>
        <label className="form-field">
          <span>Phone number or email</span>
          <input
            autoComplete="email"
            maxLength={254}
            onChange={(event) => setContact(event.target.value)}
            placeholder="Contact used for your request"
            required
            value={contact}
          />
        </label>
        <button className="button button-navy" disabled={isLoading} type="submit">
          {isLoading ? "Checking..." : "Track request"}
        </button>
      </form>

      {feedback ? (
        <p className="request-tracker-feedback" role="alert">{feedback}</p>
      ) : null}
      {inquiry ? (
        <div className="request-tracker-result" aria-live="polite">
          <div>
            <span>Request {inquiry.reference_code}</span>
            <strong>{inquiry.event_type} · {formatDate(inquiry.preferred_date)}</strong>
          </div>
          <span className={`request-tracker-status request-tracker-status-${inquiry.inquiry_status}`}>
            {inquiry.inquiry_status}
          </span>
        </div>
      ) : null}
    </section>
  );
}
