"use client";

import { useState, type ReactNode } from "react";
import AvailabilityCalendar from "./availability-calendar";
import InquiryForm from "./inquiry-form";

export default function ReservationFormLayout({
  minDate,
  children,
}: {
  minDate: string;
  children: ReactNode;
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const [venueId, setVenueId] = useState("");
  const [packageId, setPackageId] = useState("");

  return (
    <section className="reserve-main">
      <div className="reserve-heading">
        {children}
        <AvailabilityCalendar
          minDate={minDate}
          onSelectDate={setSelectedDate}
          packageId={packageId}
          selectedDate={selectedDate}
          venueId={venueId}
        />
      </div>

      <div className="reserve-form-wrap">
        <InquiryForm
          minDate={minDate}
          packageId={packageId}
          selectedDate={selectedDate}
          setPackageId={setPackageId}
          setSelectedDate={setSelectedDate}
          setVenueId={setVenueId}
          venueId={venueId}
        />
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
  );
}
