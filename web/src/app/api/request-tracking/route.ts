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
    .regex(/^VCI-[A-F0-9]{12}$/),
  contact: z
    .string()
    .trim()
    .max(254)
    .refine(
      (value) =>
        z.string().email().safeParse(value).success ||
        /^[+\d][\d\s().-]{6,19}$/.test(value),
      "Enter the phone number or email used for your inquiry.",
    ),
});

const inquirySchema = z.object({
  reference_code: z.string(),
  inquiry_status: z.enum(["new", "reviewing", "quoted", "declined", "converted"]),
  event_type: z.string(),
  preferred_date: z.string(),
  created_at: z.string(),
});

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = lookupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter a valid request reference and the phone number or email used for your inquiry." },
      { ...noStore, status: 400 },
    );
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .rpc("track_reservation_inquiry", {
        p_code: parsed.data.referenceCode,
        p_contact: parsed.data.contact,
      })
      .maybeSingle();

    if (error) {
      if (error.code === "42883" || error.code === "PGRST202") {
        console.error("Inquiry lookup function is missing:", error.message);
        return NextResponse.json(
          { message: "Request tracking is not configured yet. Please contact the venue." },
          { ...noStore, status: 503 },
        );
      }

      console.error("Could not look up reservation inquiry:", error.message);
      return NextResponse.json(
        { message: "We couldn't check your request right now. Please try again later." },
        { ...noStore, status: 503 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { message: "We couldn't find a request with those details. Check your reference and contact information." },
        { ...noStore, status: 404 },
      );
    }

    const result = inquirySchema.safeParse(data);
    if (!result.success) {
      console.error("Inquiry lookup returned an unexpected result.");
      return NextResponse.json(
        { message: "We couldn't read the request details. Please try again later." },
        { ...noStore, status: 503 },
      );
    }

    return NextResponse.json({ inquiry: result.data }, noStore);
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
