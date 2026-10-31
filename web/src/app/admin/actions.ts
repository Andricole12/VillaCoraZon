"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getManilaToday } from "@/lib/dates";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

const statusSchema = z.enum(["new", "reviewing", "declined"]);

const quotationSchema = z.object({
  inquiryId: z.coerce.number().int().positive(),
  quoteAmount: z.coerce.number().finite().positive().max(99_999_999.99),
  quoteValidUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }),
  quoteNotes: z.string().trim().max(2000),
});

const depositSchema = z.object({
  inquiryId: z.coerce.number().int().positive(),
  depositAmount: z.coerce.number().finite().positive().max(99_999_999.99),
  paymentMethod: z.enum(["Cash", "GCash", "Maya", "Bank transfer", "Other"]),
  paymentReference: z.string().trim().max(100),
});

const venueAvailabilitySchema = z.object({
  venueId: z.coerce.number().int().positive(),
  isAvailable: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const packageAvailabilitySchema = z.object({
  packageId: z.coerce.number().int().positive(),
  isAvailable: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const serviceProviderStatusSchema = z.object({
  providerId: z.coerce.number().int().positive(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const reservationEditSchema = z.object({
  reservationId: z.coerce.number().int().positive(),
  eventType: z.string().trim().min(1).max(100),
  startAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  endAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  guestCount: z.coerce.number().int().min(1).max(1000),
  specialRequest: z.string().trim().max(2000),
});

function isValidManilaDateTime(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= new Date(Date.UTC(year, month, 0)).getUTCDate() &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

function reservationEditPath(reservationId: number) {
  return `/admin/reservations/${reservationId}/edit`;
}

export type LoginFormState = {
  error?: string;
};

export async function signInAdmin(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address and password." };
  }

  const supabase = await createSupabaseServerClient({ writableCookies: true });
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { error: "Sign-in failed. Check your email and password, then try again." };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("admin_id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Could not verify admin after sign-in:", adminError.message);
    await supabase.auth.signOut();
    return { error: "We couldn't verify staff access. Please try again later." };
  }

  if (!admin) {
    await supabase.auth.signOut();
    return {
      error: "This account does not have staff access. Contact the venue owner.",
    };
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient({ writableCookies: true });
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Admin sign-out failed:", error.message);
    throw new Error("Could not sign out. Please try again.");
  }

  redirect("/admin/login");
}

export async function updateInquiryStatus(formData: FormData) {
  const inquiryId = z.coerce.number().int().positive().safeParse(formData.get("inquiryId"));
  const status = statusSchema.safeParse(formData.get("status"));

  if (!inquiryId.success || !status.success) {
    redirect("/admin?update=failed");
  }

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("reservation_inquiries")
    .update({ inquiry_status: status.data })
    .eq("inquiry_id", inquiryId.data)
    .select("inquiry_id")
    .maybeSingle();

  if (error) {
    console.error("Could not update inquiry status:", error.message);
    redirect("/admin?update=failed");
  }

  if (!data) {
    redirect("/admin?update=failed");
  }

  revalidatePath("/admin");
  redirect("/admin?updated=1");
}

export async function deleteDeclinedInquiry(formData: FormData) {
  const inquiryId = z.coerce.number().int().positive().safeParse(formData.get("inquiryId"));

  if (!inquiryId.success) {
    redirect("/admin?delete=failed");
  }

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("reservation_inquiries")
    .delete()
    .eq("inquiry_id", inquiryId.data)
    .eq("inquiry_status", "declined")
    .select("inquiry_id")
    .maybeSingle();

  if (error) {
    console.error("Could not delete declined inquiry:", error.message);
    redirect("/admin?delete=failed");
  }

  if (!data) {
    redirect("/admin?delete=failed");
  }

  revalidatePath("/admin");
  redirect("/admin?delete=success");
}

export async function saveInquiryQuotation(formData: FormData) {
  const parsed = quotationSchema.safeParse({
    inquiryId: formData.get("inquiryId"),
    quoteAmount: formData.get("quoteAmount"),
    quoteValidUntil: formData.get("quoteValidUntil"),
    quoteNotes: formData.get("quoteNotes") ?? "",
  });

  if (!parsed.success || parsed.data.quoteValidUntil < getManilaToday()) {
    redirect("/admin?quote=invalid");
  }

  const { supabase, admin } = await requireAdmin();
  const { data, error } = await supabase
    .from("reservation_inquiries")
    .update({
      quote_amount: parsed.data.quoteAmount,
      quote_valid_until: parsed.data.quoteValidUntil,
      quote_notes: parsed.data.quoteNotes || null,
      quoted_at: new Date().toISOString(),
      quoted_by: admin.admin_id,
      inquiry_status: "quoted",
    })
    .eq("inquiry_id", parsed.data.inquiryId)
    .in("inquiry_status", ["new", "reviewing", "quoted"])
    .select("inquiry_id")
    .maybeSingle();

  if (error) {
    console.error("Could not save inquiry quotation:", error.message);
    redirect("/admin?quote=failed");
  }

  if (!data) {
    redirect("/admin?quote=failed");
  }

  revalidatePath("/admin");
  redirect("/admin?quote=saved");
}

export async function confirmInquiryReservation(formData: FormData) {
  const parsed = depositSchema.safeParse({
    inquiryId: formData.get("inquiryId"),
    depositAmount: formData.get("depositAmount"),
    paymentMethod: formData.get("paymentMethod"),
    paymentReference: formData.get("paymentReference") ?? "",
  });

  if (
    !parsed.success ||
    formData.get("customerAcceptedQuote") !== "on" ||
    formData.get("depositVerified") !== "on"
  ) {
    redirect("/admin?confirm=invalid");
  }

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .rpc("confirm_inquiry_with_deposit", {
      p_inquiry_id: parsed.data.inquiryId,
      p_deposit_amount: parsed.data.depositAmount,
      p_payment_method: parsed.data.paymentMethod,
      p_payment_reference: parsed.data.paymentReference || null,
      p_customer_accepted: true,
      p_deposit_verified: true,
    })
    .single();

  if (error) {
    if (error.code === "23P01") {
      redirect("/admin?confirm=conflict");
    }

    if (error.code === "22023") {
      redirect("/admin?confirm=invalid");
    }

    if (error.code === "P0001") {
      redirect("/admin?confirm=ineligible");
    }

    console.error("Could not confirm reservation and record deposit:", error.message);
    redirect("/admin?confirm=failed");
  }

  if (!data) {
    redirect("/admin?confirm=failed");
  }

  const result = z.object({ reference_code: z.string().min(1) }).safeParse(data);
  if (!result.success) {
    console.error("Reservation confirmation returned an invalid result.");
    redirect("/admin?confirm=failed");
  }

  revalidatePath("/admin");
  redirect(
    `/admin?confirm=success&reference=${encodeURIComponent(result.data.reference_code)}`,
  );
}

export async function updateReservation(formData: FormData) {
  const parsed = reservationEditSchema.safeParse({
    reservationId: formData.get("reservationId"),
    eventType: formData.get("eventType"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    guestCount: formData.get("guestCount"),
    specialRequest: formData.get("specialRequest") ?? "",
  });

  if (
    !parsed.success ||
    !isValidManilaDateTime(parsed.data.startAt) ||
    !isValidManilaDateTime(parsed.data.endAt) ||
    parsed.data.startAt >= parsed.data.endAt ||
    (parsed.success &&
      isValidManilaDateTime(parsed.data.startAt) &&
      new Date(`${parsed.data.startAt}:00+08:00`).getTime() <= Date.now())
  ) {
    const reservationId = z.coerce.number().int().positive().safeParse(formData.get("reservationId"));
    if (reservationId.success) {
      redirect(`${reservationEditPath(reservationId.data)}?error=invalid`);
    }
    redirect("/admin/reservations");
  }

  const { supabase } = await requireAdmin();
  const startAt = new Date(`${parsed.data.startAt}:00+08:00`).toISOString();
  const endAt = new Date(`${parsed.data.endAt}:00+08:00`).toISOString();
  const { data, error } = await supabase
    .from("reservations")
    .update({
      event_type: parsed.data.eventType,
      start_at: startAt,
      end_at: endAt,
      guest_count: parsed.data.guestCount,
      special_request: parsed.data.specialRequest || null,
    })
    .eq("reservation_id", parsed.data.reservationId)
    .in("reservation_status", ["pending", "confirmed"])
    .select("reservation_id")
    .maybeSingle();

  if (error) {
    if (error.code === "23P01") {
      redirect(`${reservationEditPath(parsed.data.reservationId)}?error=conflict`);
    }

    console.error("Could not update reservation:", error.message);
    redirect(`${reservationEditPath(parsed.data.reservationId)}?error=failed`);
  }

  if (!data) {
    redirect(`${reservationEditPath(parsed.data.reservationId)}?error=unavailable`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/calendar");
  revalidatePath(`/admin/reservations/${parsed.data.reservationId}/invoice`);
  redirect("/admin/reservations?updated=1");
}

export async function updateVenueAvailability(formData: FormData) {
  const parsed = venueAvailabilitySchema.safeParse({
    venueId: formData.get("venueId"),
    isAvailable: formData.get("isAvailable"),
  });
  if (!parsed.success) redirect("/admin/venues?update=failed");

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("venues")
    .update({ is_available: parsed.data.isAvailable })
    .eq("venue_id", parsed.data.venueId)
    .select("venue_id")
    .maybeSingle();

  if (error) {
    console.error("Could not update venue availability:", error.message);
    redirect("/admin/venues?update=failed");
  }
  if (!data) redirect("/admin/venues?update=failed");

  revalidatePath("/admin/venues");
  revalidatePath("/reserve");
  redirect("/admin/venues?updated=1");
}

export async function updatePackageAvailability(formData: FormData) {
  const parsed = packageAvailabilitySchema.safeParse({
    packageId: formData.get("packageId"),
    isAvailable: formData.get("isAvailable"),
  });
  if (!parsed.success) redirect("/admin/packages?update=failed");

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("packages")
    .update({ is_available: parsed.data.isAvailable })
    .eq("package_id", parsed.data.packageId)
    .select("package_id")
    .maybeSingle();

  if (error) {
    console.error("Could not update package availability:", error.message);
    redirect("/admin/packages?update=failed");
  }
  if (!data) redirect("/admin/packages?update=failed");

  revalidatePath("/admin/packages");
  revalidatePath("/reserve");
  redirect("/admin/packages?updated=1");
}

export async function updateServiceProviderStatus(formData: FormData) {
  const parsed = serviceProviderStatusSchema.safeParse({
    providerId: formData.get("providerId"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) redirect("/admin/packages?update=failed");

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("service_providers")
    .update({ is_active: parsed.data.isActive })
    .eq("provider_id", parsed.data.providerId)
    .select("provider_id")
    .maybeSingle();

  if (error) {
    console.error("Could not update service-provider status:", error.message);
    redirect("/admin/packages?update=failed");
  }
  if (!data) redirect("/admin/packages?update=failed");

  revalidatePath("/admin/packages");
  redirect("/admin/packages?updated=1");
}
