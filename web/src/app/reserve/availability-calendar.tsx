"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

const availabilitySchema = z.object({
  availability: z.array(
    z.object({
      event_date: z.string(),
      availability_status: z.enum(["available", "pending", "unavailable"]),
    }),
  ),
});

type Availability = z.infer<typeof availabilitySchema>["availability"];

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(value: string, amount: number) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return monthKey(date.getUTCFullYear(), date.getUTCMonth() + 1);
}

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export default function AvailabilityCalendar({
  minDate,
  selectedDate,
  venueId,
  packageId,
  onSelectDate,
}: {
  minDate: string;
  selectedDate: string;
  venueId: string;
  packageId: string;
  onSelectDate: (date: string) => void;
}) {
  const firstAllowedMonth = minDate.slice(0, 7);
  const [month, setMonth] = useState(firstAllowedMonth);
  const [availabilityResult, setAvailabilityResult] = useState<{
    key: string;
    availability: Availability;
    error: string;
  } | null>(null);

  const queryKey = `${month}:${venueId}:${packageId}`;
  const currentResult = availabilityResult?.key === queryKey ? availabilityResult : null;
  const error = currentResult?.error ?? "";
  const isLoading = Boolean(venueId && packageId && !currentResult);
  const availabilityByDate = useMemo(
    () => new Map(
      (currentResult?.availability ?? []).map((item) => [
        item.event_date,
        item.availability_status,
      ]),
    ),
    [currentResult],
  );
  const selectedAvailability = availabilityByDate.get(selectedDate);
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const firstDayOffset = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      day,
      date: `${month}-${String(day).padStart(2, "0")}`,
    };
  });
  const latestMonth = shiftMonth(firstAllowedMonth, 24);

  useEffect(() => {
    if (!venueId || !packageId) {
      return;
    }

    const controller = new AbortController();
    async function loadAvailability() {
      try {
        const query = new URLSearchParams({ month, venueId, packageId });
        const response = await fetch(`/api/reservation-availability?${query}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string"
              ? result.message
              : "We couldn't check live availability.";
          setAvailabilityResult({ key: queryKey, availability: [], error: message });
          return;
        }

        const parsed = availabilitySchema.safeParse(result);
        if (!parsed.success) {
          setAvailabilityResult({
            key: queryKey,
            availability: [],
            error: "Availability information couldn't be read. Please refresh and try again.",
          });
          return;
        }

        setAvailabilityResult({
          key: queryKey,
          availability: parsed.data.availability,
          error: "",
        });
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setAvailabilityResult({
          key: queryKey,
          availability: [],
          error: "We couldn't check live availability. Please try again.",
        });
      }
    }

    void loadAvailability();
    return () => controller.abort();
  }, [month, packageId, queryKey, venueId]);

  return (
    <section className="availability-preview" aria-label="Live date availability preview">
      {!venueId || !packageId ? (
        <p className="availability-instructions">
          Choose a space and package/time below to see available dates.
        </p>
      ) : null}
      <div className="availability-calendar-heading">
        <div>
          <span className="availability-eyebrow">LIVE AVAILABILITY PREVIEW</span>
          <h3>{formatMonth(month)}</h3>
        </div>
        <span className="availability-calendar-icon" aria-hidden="true">
          <svg fill="none" viewBox="0 0 24 24">
            <rect x="4" y="6" width="16" height="15" rx="2" />
            <path d="M8 3v5m8-5v5M4 10h16" />
          </svg>
        </span>
        <div className="availability-month-controls">
          <button
            type="button"
            aria-label="Previous month"
            disabled={month <= firstAllowedMonth}
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={month >= latestMonth}
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
          >
            ›
          </button>
        </div>
      </div>

      <div className="availability-weekdays" aria-hidden="true">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="availability-days">
        {Array.from({ length: firstDayOffset }, (_, index) => (
          <span className="availability-day-empty" key={`empty-${index}`} />
        ))}
        {days.map(({ day, date }) => {
          const status = availabilityByDate.get(date);
          const isPast = date < minDate;
          const isBusy = status === "pending" || status === "unavailable";
          const selected = selectedDate === date;
          const isToday = date === minDate;
          const stateLabel = isPast
            ? "Past date"
            : status === "pending"
            ? "Pending hold"
            : status === "unavailable"
              ? "Unavailable"
              : status === "available"
                ? "Available"
                : "Availability not loaded";

          return (
            <button
              aria-label={`${formatDayLabel(date)}${isPast || status ? `, ${stateLabel}` : ""}${selected ? ", selected" : ""}`}
              aria-pressed={selected}
              className={[
                "availability-day",
                isPast || status === "unavailable"
                  ? "availability-day-unavailable"
                  : status
                    ? `availability-day-${status}`
                    : "availability-day-unknown",
                isPast ? "availability-day-past" : "",
                isToday ? "availability-day-today" : "",
                selected ? "availability-day-selected" : "",
              ].filter(Boolean).join(" ")}
              disabled={isPast || isBusy || status !== "available"}
              key={date}
              onClick={() => onSelectDate(date)}
              title={isPast || status ? stateLabel : undefined}
              type="button"
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="availability-legend" aria-label="Availability key">
        <span><i className="availability-legend-available" />Available</span>
        <span><i className="availability-legend-pending" />Pending hold</span>
        <span><i className="availability-legend-unavailable" />Unavailable / past</span>
      </div>
      <p className="availability-message" role={error ? "alert" : "status"}>
        {error
          ? error
          : isLoading
            ? "Checking the selected space and package..."
            : selectedDate && selectedAvailability === "available"
              ? `${formatDayLabel(selectedDate)} is currently available. Final availability is rechecked before submission.`
              : venueId && packageId
                ? "Select an available date. Final availability is rechecked before submission."
              : "Choose a space and package to see their live date availability."}
      </p>
    </section>
  );
}
