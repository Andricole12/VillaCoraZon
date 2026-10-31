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
