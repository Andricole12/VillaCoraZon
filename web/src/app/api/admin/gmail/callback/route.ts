import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import {
  getGmailOAuthConfig,
  gmailOAuthStateCookie,
  gmailOAuthStateCookieOptions,
  saveGmailConnection,
} from "@/lib/gmail";

function redirectToAdmin(request: NextRequest, result: string) {
  const response = NextResponse.redirect(new URL(`/admin?gmail=${result}`, request.url));
  response.cookies.set(gmailOAuthStateCookie, "", gmailOAuthStateCookieOptions(0));
  return response;
}

export async function GET(request: NextRequest) {
  const { admin } = await requireAdmin();
  const params = request.nextUrl.searchParams;
  if (params.get("error")) return redirectToAdmin(request, "denied");

  const code = params.get("code");
  const state = params.get("state");
  const storedState = request.cookies.get(gmailOAuthStateCookie)?.value;
  if (!code || !state || storedState !== `${admin.admin_id}.${state}`) {
    return redirectToAdmin(request, "invalid_state");
  }

  const config = getGmailOAuthConfig();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const tokenResult: unknown = await tokenResponse.json();
  if (!tokenResponse.ok || typeof tokenResult !== "object" || tokenResult === null) {
    console.error("Google OAuth code exchange failed:", tokenResponse.status);
    return redirectToAdmin(request, "connect_failed");
  }

  const { access_token: accessToken, refresh_token: refreshToken } = tokenResult as {
    access_token?: unknown;
    refresh_token?: unknown;
  };
  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    console.error("Google OAuth did not return both access and refresh tokens.");
    return redirectToAdmin(request, "connect_failed");
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const profile: unknown = await profileResponse.json();
  if (
    !profileResponse.ok ||
    typeof profile !== "object" ||
    profile === null ||
    !("email" in profile) ||
    typeof profile.email !== "string"
  ) {
    console.error("Could not read the connected Google account profile:", profileResponse.status);
    return redirectToAdmin(request, "connect_failed");
  }

  await saveGmailConnection({
    adminId: admin.admin_id,
    email: profile.email,
    refreshToken,
  });
  return redirectToAdmin(request, "connected");
}
