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
    <main className="reserve-main" id="main-content">
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
        <ol className="reserve-steps" aria-label="Reservation process">
          <li><span>01</span><strong>Send an inquiry</strong></li>
          <li><span>02</span><strong>Review your quote</strong></li>
          <li><span>03</span><strong>Confirm with deposit</strong></li>
        </ol>
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
    </main>
  );
}
