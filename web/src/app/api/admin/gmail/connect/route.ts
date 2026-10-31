import { randomUUID } from "node:crypto";
import { connection, NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import {
  getGmailOAuthConfig,
  gmailOAuthStateCookie,
  gmailOAuthStateCookieOptions,
  isGmailOAuthConfigured,
} from "@/lib/gmail";

export async function GET(request: NextRequest) {
  await connection();
  const { admin } = await requireAdmin();
  if (!isGmailOAuthConfigured()) {
    return NextResponse.redirect(new URL("/admin?gmail=setup_required", request.url));
  }

  const config = getGmailOAuthConfig();
  const state = randomUUID();
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(
    gmailOAuthStateCookie,
    `${admin.admin_id}.${state}`,
    gmailOAuthStateCookieOptions(600),
  );
  return response;
}
