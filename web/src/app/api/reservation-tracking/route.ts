import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabasePublicClient,
  SupabaseConfigurationError,
} from "@/lib/supabase/server";

const lookupSchema = z.object({
  referenceCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^VC-[A-F0-9]{6}$/, "Enter the reference code from your confirmation."),
  contact: z
    .string()
    .trim()
    .max(254)
    .refine(
      (value) =>
        z.string().email().safeParse(value).success ||
        /^[+\d][\d\s().-]{6,19}$/.test(value),
      "Enter the phone number or email used for the reservation.",
    ),
});

const noStore = { headers: { "Cache-Control": "no-store" } };

const reservationSchema = z.object({
  reference_code: z.string(),
  reservation_status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
  event_type: z.string(),
  start_at: z.string(),
  end_at: z.string(),
  guest_count: z.number(),
  total_amount: z.number(),
  total_paid: z.number(),
  balance: z.number(),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = lookupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter a valid reference code and the phone number or email used for the reservation." },
      { ...noStore, status: 400 },
    );
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .rpc("track_reservation", {
        p_code: parsed.data.referenceCode,
        p_contact: parsed.data.contact,
      })
      .maybeSingle();

    if (error) {
      if (error.code === "42883" || error.code === "PGRST202") {
        console.error("Reservation lookup function is missing:", error.message);
        return NextResponse.json(
          { message: "Reservation lookup is not configured yet. Please contact the venue." },
          { ...noStore, status: 503 },
        );
      }

      console.error("Could not look up reservation:", error.message);
      return NextResponse.json(
        { message: "We couldn't check your reservation right now. Please try again later." },
        { ...noStore, status: 503 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { message: "We couldn't find a reservation with those details. Check your reference code and contact information." },
        { ...noStore, status: 404 },
      );
    }

    const result = reservationSchema.safeParse(data);
    if (!result.success) {
      console.error("Reservation lookup returned an unexpected result.");
      return NextResponse.json(
        { message: "We couldn't read the reservation details. Please try again later." },
        { ...noStore, status: 503 },
      );
    }

    return NextResponse.json({ reservation: result.data }, noStore);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json(
        { message: "The reservation service is not configured yet." },
        { ...noStore, status: 503 },
      );
    }

    throw error;
  }
}
