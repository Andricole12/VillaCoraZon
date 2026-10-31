import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildQuotationEmailHtml,
  buildQuotationEmailText,
  quotationEmailSubject,
  type QuotationEmailDetails,
} from "@/lib/quotation-email";
import {
  clearGmailConnection,
  createGmailDraft,
  getGmailConnection,
  GmailProviderError,
  GmailReconnectRequiredError,
  isGmailOAuthConfigured,
} from "@/lib/gmail";
import { requireAdmin } from "@/lib/supabase/admin";

const requestSchema = z.object({
  inquiryId: z.coerce.number().int().positive(),
});

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }

  const { supabase, admin } = await requireAdmin();
  if (!isGmailOAuthConfigured()) {
    return NextResponse.json(
      { code: "setup_required", message: "Gmail draft setup is not configured yet." },
      { status: 503 },
    );
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Select a valid inquiry." }, { status: 400 });
  }

  const connection = await getGmailConnection(admin.admin_id);
  if (!connection) {
    return NextResponse.json(
      { code: "connect_required", message: "Connect a Gmail account to create the draft." },
      { status: 409 },
    );
  }

  const { data: inquiry, error } = await supabase
    .from("reservation_inquiries")
    .select(
      "inquiry_id, customer_name, email, event_type, preferred_date, guest_count, quote_amount, quote_valid_until, quote_notes, venues(venue_name), packages(package_name)",
    )
    .eq("inquiry_id", parsed.data.inquiryId)
    .maybeSingle();

  if (error) {
    console.error("Could not load quotation for Gmail draft:", error.message);
    return NextResponse.json(
      { message: "Could not load the saved quotation. Refresh and try again." },
      { status: 500 },
    );
  }
  if (
    !inquiry ||
    !inquiry.email ||
    !z.string().email().safeParse(inquiry.email).success ||
    inquiry.quote_amount === null ||
    !inquiry.quote_valid_until
  ) {
    return NextResponse.json(
      { message: "This inquiry does not have a saved quotation and customer email." },
      { status: 409 },
    );
  }

  const details: QuotationEmailDetails = {
    customerName: inquiry.customer_name,
    eventType: inquiry.event_type,
    eventDate: formatEventDate(inquiry.preferred_date),
    venue: inquiry.venues?.[0]?.venue_name ?? "Villa Corazon Events Place",
    packageName: inquiry.packages?.[0]?.package_name ?? "To be confirmed",
    guestCount: inquiry.guest_count,
    amount: formatCurrency(Number(inquiry.quote_amount)),
    validUntil: formatEventDate(inquiry.quote_valid_until),
    notes: inquiry.quote_notes ?? "",
  };

  try {
    const draft = await createGmailDraft({
      connection,
      recipient: inquiry.email,
      subject: quotationEmailSubject(details),
      plainText: buildQuotationEmailText(details),
      html: buildQuotationEmailHtml(details),
    });
    const draftUrl = new URL("https://mail.google.com/mail/u/0/");
    draftUrl.searchParams.set("authuser", connection.email);
    draftUrl.hash = `drafts?compose=${encodeURIComponent(draft.messageId)}`;
    return NextResponse.json({
      draftUrl: draftUrl.toString(),
    });
  } catch (draftError) {
    if (draftError instanceof GmailReconnectRequiredError) {
      await clearGmailConnection();
      return NextResponse.json(
        { code: "reconnect_required", message: "Reconnect Gmail to create a draft." },
        { status: 409 },
      );
    }
    if (draftError instanceof GmailProviderError) {
      console.error("Gmail draft creation failed:", draftError.message);
      return NextResponse.json(
        { message: "Gmail could not create the draft. Try again or reconnect the account." },
        { status: 502 },
      );
    }
    console.error(
      "Gmail draft request failed:",
      draftError instanceof Error ? draftError.message : "Unknown error",
    );
    return NextResponse.json(
      { message: "Could not reach Gmail. Check your connection and try again." },
      { status: 502 },
    );
  }
}
