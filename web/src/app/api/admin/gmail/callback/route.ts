import { connection, NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import {
  getGmailConnection,
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
  await connection();
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
  let tokenResult: unknown;
  try {
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
    tokenResult = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Google OAuth code exchange failed:", tokenResponse.status);
      return redirectToAdmin(request, "connect_failed");
    }
  } catch (error) {
    console.error(
      "Google OAuth code exchange failed:",
      error instanceof Error ? error.message : "Unknown network error",
    );
    return redirectToAdmin(request, "connect_failed");
  }
  if (typeof tokenResult !== "object" || tokenResult === null) {
    return redirectToAdmin(request, "connect_failed");
  }

  const { access_token: accessToken, refresh_token: refreshToken } = tokenResult as {
    access_token?: unknown;
    refresh_token?: unknown;
  };
  if (typeof accessToken !== "string") {
    console.error("Google OAuth did not return an access token.");
    return redirectToAdmin(request, "connect_failed");
  }

  let profile: unknown;
  try {
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    profile = await profileResponse.json();
    if (!profileResponse.ok) {
      console.error("Could not read the connected Google account profile:", profileResponse.status);
      return redirectToAdmin(request, "connect_failed");
    }
  } catch (error) {
    console.error(
      "Could not read the connected Google account profile:",
      error instanceof Error ? error.message : "Unknown network error",
    );
    return redirectToAdmin(request, "connect_failed");
  }
  if (
    typeof profile !== "object" ||
    profile === null ||
    !("email" in profile) ||
    typeof profile.email !== "string"
  ) {
    console.error("Google did not return a valid connected account email.");
    return redirectToAdmin(request, "connect_failed");
  }

  const previousConnection = await getGmailConnection(admin.admin_id);
  const reusableRefreshToken =
    previousConnection?.email.toLowerCase() === profile.email.toLowerCase()
      ? previousConnection.refreshToken
      : null;
  const savedRefreshToken =
    typeof refreshToken === "string" ? refreshToken : reusableRefreshToken;
  if (!savedRefreshToken) {
    console.error("Google OAuth did not return a refresh token for this Gmail account.");
    return redirectToAdmin(request, "connect_failed");
  }

  await saveGmailConnection({
    adminId: admin.admin_id,
    email: profile.email,
    refreshToken: savedRefreshToken,
  });
  return redirectToAdmin(request, "connected");
}
