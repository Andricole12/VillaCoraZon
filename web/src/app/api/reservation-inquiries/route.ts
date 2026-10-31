import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabasePublicClient,
  SupabaseConfigurationError,
} from "@/lib/supabase/server";
import { getManilaToday } from "@/lib/dates";

const inquirySchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  contactNumber: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^[+\d][\d\s().-]*$/),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  eventType: z.enum(["Wedding", "Birthday", "Family gathering", "Corporate", "Other"]),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }),
  guestCount: z.coerce.number().int().min(1).max(1000),
  venueId: z.coerce.number().int().positive(),
  packageId: z.coerce.number().int().positive(),
  specialRequest: z.string().trim().max(2000).optional(),
});

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const [venuesResult, packagesResult] = await Promise.all([
      supabase
        .from("venues")
        .select("venue_id, venue_name, capacity")
        .eq("is_available", true)
        .order("venue_name"),
      supabase
        .from("packages")
        .select("package_id, package_name, package_type, start_time, end_time")
        .eq("is_available", true)
        .order("package_id"),
    ]);

    const error = venuesResult.error ?? packagesResult.error;
    if (error) {
      if (error.code === "PGRST205") {
        return NextResponse.json(
          {
            message:
              "Venue or package data is missing. Apply the project schema in Supabase.",
          },
          { status: 503 },
        );
      }

      console.error(
        "Could not load reservation inquiry options:",
        error.message,
      );
      return NextResponse.json(
        { message: "We couldn't load the reservation options. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      venues: venuesResult.data,
      packages: packagesResult.data,
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json(
        { message: "The reservation service is not configured yet." },
        { status: 503 },
      );
    }

    throw error;
  }
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = inquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please check your details and try again." },
      { status: 400 },
    );
  }

  const inquiry = parsed.data;
  if (inquiry.preferredDate < getManilaToday()) {
    return NextResponse.json(
      { message: "Please choose today or a future date." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabasePublicClient();
    const [venueResult, packageResult] = await Promise.all([
      supabase
        .from("venues")
        .select("venue_id")
        .eq("venue_id", inquiry.venueId)
        .eq("is_available", true)
        .maybeSingle(),
      supabase
        .from("packages")
        .select("package_id")
        .eq("package_id", inquiry.packageId)
        .eq("is_available", true)
        .maybeSingle(),
    ]);

    if (venueResult.error || packageResult.error) {
      console.error(
        "Could not validate reservation inquiry options:",
        venueResult.error?.message ?? packageResult.error?.message,
      );
      return NextResponse.json(
        { message: "We couldn't verify the selected options. Please try again later." },
        { status: 503 },
      );
    }

    if (!venueResult.data || !packageResult.data) {
      return NextResponse.json(
        { message: "One of your selected options is no longer available. Please refresh and try again." },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("reservation_inquiries").insert({
      customer_name: inquiry.customerName,
      contact_number: inquiry.contactNumber,
      email: inquiry.email || null,
      event_type: inquiry.eventType,
      preferred_date: inquiry.preferredDate,
      guest_count: inquiry.guestCount,
      venue_id: inquiry.venueId,
      package_id: inquiry.packageId,
      special_request: inquiry.specialRequest || null,
    });

    if (error) {
      if (error.code === "PGRST205") {
        return NextResponse.json(
          {
            message:
              "The reservation inquiry table is missing. Apply the reservation inquiry migration in Supabase.",
          },
          { status: 503 },
        );
      }

      console.error("Could not save reservation inquiry:", error.message);
      return NextResponse.json(
        { message: "We couldn't submit your request. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        message:
          "Your inquiry was received. It does not reserve the date; staff will contact you with availability and a quotation.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json(
        { message: "The reservation service is not configured yet." },
        { status: 503 },
      );
    }

    throw error;
  }
}
