import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabasePublicClient,
  SupabaseConfigurationError,
} from "@/lib/supabase/server";
import { getManilaToday } from "@/lib/dates";

const querySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  venueId: z.coerce.number().int().positive(),
  packageId: z.coerce.number().int().positive(),
});

const resultSchema = z.array(
  z.object({
    event_date: z.string(),
    availability_status: z.enum(["available", "pending", "unavailable"]),
  }),
);

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    month: search.get("month"),
    venueId: search.get("venueId"),
    packageId: search.get("packageId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Choose a valid month, space, and package to check availability." },
      { ...noStore, status: 400 },
    );
  }

  const month = `${parsed.data.month}-01`;
  const monthDate = new Date(`${month}T00:00:00Z`);
  const todayDate = new Date(`${getManilaToday()}T00:00:00Z`);
  const monthNumber = monthDate.getUTCFullYear() * 12 + monthDate.getUTCMonth();
  const todayMonthNumber = todayDate.getUTCFullYear() * 12 + todayDate.getUTCMonth();

  if (
    Number.isNaN(monthDate.getTime()) ||
    monthDate.toISOString().slice(0, 10) !== month ||
    monthNumber < todayMonthNumber ||
    monthNumber > todayMonthNumber + 24
  ) {
    return NextResponse.json(
      { message: "Choose a month within the next two years." },
      { ...noStore, status: 400 },
    );
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc("get_public_availability", {
      p_venue_id: parsed.data.venueId,
      p_package_id: parsed.data.packageId,
      p_month: month,
    });

    if (error) {
      if (error.code === "42883" || error.code === "PGRST202") {
        console.error("Public availability function is missing:", error.message);
        return NextResponse.json(
          { message: "Live availability is not configured yet. Please contact the venue." },
          { ...noStore, status: 503 },
        );
      }

      console.error("Could not load reservation availability:", error.message);
      return NextResponse.json(
        { message: "We couldn't check availability right now. Please try again later." },
        { ...noStore, status: 503 },
      );
    }

    const result = resultSchema.safeParse(data);
    if (!result.success) {
      console.error("Availability lookup returned an unexpected result.");
      return NextResponse.json(
        { message: "We couldn't read availability. Please try again later." },
        { ...noStore, status: 503 },
      );
    }

    return NextResponse.json({ availability: result.data }, noStore);
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
