import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export class SupabaseConfigurationError extends Error {}

function getSupabaseCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new SupabaseConfigurationError(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, key };
}

export function createSupabasePublicClient() {
  const { url, key } = getSupabaseCredentials();
  return createClient(url, key);
}

export async function createSupabaseServerClient(options?: {
  writableCookies?: boolean;
}) {
  const { url, key } = getSupabaseCredentials();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (!options?.writableCookies && cookiesToSet.length > 0) {
          throw new Error(
            "Supabase tried to update cookies in a read-only server component. Use the auth proxy or a server action.",
          );
        }

        cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
          cookieStore.set(name, value, cookieOptions);
        });
      },
    },
  });
}
