import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Could not verify admin session:", userError.message);
    redirect("/admin/login");
  }

  if (!user) {
    redirect("/admin/login");
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("admin_id, admin_name, email, admin_role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Could not verify admin access:", adminError.message);
    throw new Error("Unable to verify staff access. Please try again.");
  }

  if (!admin) {
    redirect("/admin/login");
  }

  return { supabase, admin };
}
