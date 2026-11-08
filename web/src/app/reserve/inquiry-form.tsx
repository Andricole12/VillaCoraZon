"use client";

import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import RequestTracker from "./request-tracker";

const optionsSchema = z.object({
  venues: z.array(
    z.object({
      venue_id: z.number(),
      venue_name: z.string(),
      capacity: z.number(),
    }),
  ),
  packages: z.array(
    z.object({
      package_id: z.number(),
      package_name: z.string(),
      package_type: z.string(),
      start_time: z.string().nullable(),
      end_time: z.string().nullable(),
    }),
  ),
});

type Options = z.infer<typeof optionsSchema>;

function formatTime(value: string | null) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export default function InquiryForm({
  minDate,
  selectedDate,
  setSelectedDate,
  venueId,
  setVenueId,
  packageId,
  setPackageId,
}: {
  minDate: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  venueId: string;
  setVenueId: (venueId: string) => void;
  packageId: string;
  setPackageId: (packageId: string) => void;
}) {
  const [options, setOptions] = useState<Options | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(
    null,
  );
  const [submittedRequest, setSubmittedRequest] = useState<{
    referenceCode: string;
    contact: string;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOptions() {
      try {
        const response = await fetch("/api/reservation-inquiries", {
          signal: controller.signal,
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string"
              ? result.message
              : "We couldn't load the reservation options.";
          setLoadError(message);
          return;
        }

        const parsed = optionsSchema.safeParse(result);
        if (!parsed.success) {
          setLoadError("The reservation options couldn't be read. Please refresh and try again.");
          return;
        }

        setOptions(parsed.data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLoadError("We couldn't load the reservation options. Please refresh and try again.");
      }
    }

    void loadOptions();
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/reservation-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();
      const message =
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : "We couldn't submit your inquiry. Please try again.";

      if (!response.ok) {
        setFeedback({ kind: "error", message });
        return;
      }

      const referenceCode =
        typeof result === "object" &&
        result !== null &&
        "referenceCode" in result &&
        typeof result.referenceCode === "string" &&
        /^VCI-[A-F0-9]{12}$/.test(result.referenceCode)
          ? result.referenceCode
          : null;
      const contact =
        String(formData.get("email") ?? "").trim() ||
        String(formData.get("contactNumber") ?? "").trim();

      form.reset();
      setSelectedDate("");
      setVenueId("");
      setPackageId("");
      setSubmittedRequest(referenceCode ? { referenceCode, contact } : null);
      setFeedback({ kind: "success", message });
    } catch {
      setFeedback({
        kind: "error",
        message: "We couldn't reach the reservation service. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="inquiry-customer-flow">
      <form className="inquiry-form" onSubmit={handleSubmit}>
      <div className="form-section-heading form-section-contact">
        <span>01</span>
        <div>
          <h2>Your contact details</h2>
          <p>So our team can get back to you about your request.</p>
        </div>
      </div>

      <div className="form-grid">
        <label className="form-field form-field-wide">
          <span>Full name <b>*</b></span>
          <input
            name="customerName"
            type="text"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            placeholder="Your name"
            required
          />
        </label>

        <label className="form-field">
          <span>Mobile number <b>*</b></span>
          <input
            name="contactNumber"
            type="tel"
            autoComplete="tel"
            minLength={7}
            maxLength={20}
            placeholder="09xx xxx xxxx"
            required
          />
        </label>

        <label className="form-field">
          <span>Email address</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder="you@example.com"
          />
        </label>
      </div>

      <div className="form-section-heading">
        <span>02</span>
        <div>
          <h2>Your event</h2>
          <p>Tell us what you are celebrating.</p>
        </div>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>Event type <b>*</b></span>
          <select name="eventType" required defaultValue="">
            <option value="" disabled>
              Select an event type
            </option>
            <option value="Wedding">Wedding</option>
            <option value="Birthday">Birthday</option>
            <option value="Family gathering">Family gathering</option>
            <option value="Corporate">Corporate event</option>
            <option value="Other">Other celebration</option>
          </select>
        </label>

        <label className="form-field">
          <span>Preferred date <b>*</b></span>
          <input
            name="preferredDate"
            type="date"
            min={minDate || undefined}
            onChange={(event) => setSelectedDate(event.target.value)}
            required
            value={selectedDate}
          />
        </label>

        <label className="form-field">
          <span>Preferred space <b>*</b></span>
          <select
            name="venueId"
            onChange={(event) => setVenueId(event.target.value)}
            required
            value={venueId}
            disabled={!options}
          >
            <option value="" disabled>
              {options ? "Choose a space" : "Loading spaces..."}
            </option>
            {options?.venues.map((venue) => (
              <option key={venue.venue_id} value={venue.venue_id}>
                {venue.venue_name} · up to {venue.capacity} guests
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Rental package <b>*</b></span>
          <select
            name="packageId"
            onChange={(event) => setPackageId(event.target.value)}
            required
            value={packageId}
            disabled={!options}
          >
            <option value="" disabled>
              {options ? "Choose a package" : "Loading packages..."}
            </option>
            {options?.packages.map((item) => {
              const start = formatTime(item.start_time);
              const end = formatTime(item.end_time);
              const hours = start && end ? ` · ${start}-${end}` : "";
              return (
                <option key={item.package_id} value={item.package_id}>
                  {item.package_name}
                  {hours}
                </option>
              );
            })}
          </select>
        </label>

        <label className="form-field">
          <span>Estimated guests <b>*</b></span>
          <input
            name="guestCount"
            type="number"
            min="1"
            max="1000"
            placeholder="e.g. 80"
            required
          />
        </label>
                <label className="form-field form-field-wide">
          <span>Anything else we should know?</span>
          <textarea
            name="specialRequest"
            rows={4}
            maxLength={2000}
            placeholder="Optional details about your event or requests"
          />
        </label>
      </div>

      {loadError ? (
        <p className="form-feedback form-feedback-error" role="alert">
          {loadError}
        </p>
      ) : null}
      {feedback ? (
        <p
          className={`form-feedback form-feedback-${feedback.kind}`}
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.message}
        </p>
      ) : null}
      {submittedRequest ? (
        <div className="request-reference-notice" role="status">
          <span>Your request reference</span>
          <strong>{submittedRequest.referenceCode}</strong>
          <small>Save this code to check your request status below.</small>
        </div>
      ) : null}

      <div className="form-submit-row">
        <p>Fields marked <b>*</b> are required.</p>
        <button
          className="button button-navy"
          type="submit"
          disabled={!options || Boolean(loadError) || isSubmitting}
        >
          {isSubmitting ? "Sending request..." : "Send inquiry"}
          <span aria-hidden="true">→</span>
        </button>
      </div>
      </form>
      <RequestTracker
        key={submittedRequest?.referenceCode ?? "request-tracker"}
        initialContact={submittedRequest?.contact}
        initialReference={submittedRequest?.referenceCode}
      />
    </div>
  );
}
