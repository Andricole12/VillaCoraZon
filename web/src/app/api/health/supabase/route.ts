import { NextResponse } from "next/server";
import {
  createSupabasePublicClient,
  SupabaseConfigurationError,
} from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { error } = await supabase.from("venues").select("venue_id").limit(1);

    if (error) {
      if (error.code === "PGRST205") {
        return NextResponse.json(
          {
            status: "schema_not_applied",
            message:
              "Supabase is reachable, but the venues table is missing. Run schema.sql once in the Supabase SQL Editor.",
          },
          { status: 503 },
        );
      }

      console.error("Supabase health check failed:", error.message);
      return NextResponse.json(
        { status: "error", message: "Supabase query failed." },
        { status: 503 },
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    if (!(error instanceof SupabaseConfigurationError)) {
      throw error;
    }

    return NextResponse.json(
      { status: "not_configured", message: "Supabase is not configured." },
      { status: 503 },
    );
  }
}
