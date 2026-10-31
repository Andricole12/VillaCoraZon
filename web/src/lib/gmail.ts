import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const connectionCookie = "vc_gmail_connection";
export const gmailOAuthStateCookie = "vc_gmail_oauth_state";
const refreshTokenCookieMaxAge = 60 * 60 * 24 * 365;

export type GmailConnection = {
  adminId: number;
  email: string;
  refreshToken: string;
};

type GmailOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export class GmailReconnectRequiredError extends Error {}

export class GmailProviderError extends Error {}

function getEncryptionKey() {
  const value = process.env.GMAIL_TOKEN_ENCRYPTION_KEY ?? "";
  if (!/^[\da-f]{64}$/i.test(value)) {
    throw new Error("GMAIL_TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters.");
  }
  return Buffer.from(value, "hex");
}

export function isGmailOAuthConfigured() {
  if (
    !process.env.GMAIL_CLIENT_ID ||
    !process.env.GMAIL_CLIENT_SECRET ||
    !process.env.GMAIL_REDIRECT_URI ||
    !/^[\da-f]{64}$/i.test(process.env.GMAIL_TOKEN_ENCRYPTION_KEY ?? "")
  ) {
    return false;
  }

  try {
    const redirectUri = new URL(process.env.GMAIL_REDIRECT_URI);
    return (
      (redirectUri.protocol === "https:" || redirectUri.hostname === "localhost") &&
      redirectUri.pathname === "/api/admin/gmail/callback" &&
      !redirectUri.search &&
      !redirectUri.hash
    );
  } catch {
    return false;
  }
}

export function getGmailOAuthConfig(): GmailOAuthConfig {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REDIRECT_URI) {
    throw new Error("Gmail OAuth environment variables are not configured.");
  }

  let redirectUri: URL;
  try {
    redirectUri = new URL(GMAIL_REDIRECT_URI);
  } catch {
    throw new Error("GMAIL_REDIRECT_URI must be an absolute URL.");
  }
  if (redirectUri.protocol !== "https:" && redirectUri.hostname !== "localhost") {
    throw new Error("GMAIL_REDIRECT_URI must use HTTPS except on localhost.");
  }

  getEncryptionKey();
  return {
    clientId: GMAIL_CLIENT_ID,
    clientSecret: GMAIL_CLIENT_SECRET,
    redirectUri: redirectUri.toString(),
  };
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function encryptConnection(connection: GmailConnection) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(connection), "utf8"),
    cipher.final(),
  ]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptConnection(value: string): GmailConnection | null {
  const [encodedIv, encodedTag, encodedData, ...extra] = value.split(".");
  if (!encodedIv || !encodedTag || !encodedData || extra.length > 0) return null;

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(encodedIv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encodedData, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const parsed: unknown = JSON.parse(decrypted);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("adminId" in parsed) ||
      typeof parsed.adminId !== "number" ||
      !("email" in parsed) ||
      typeof parsed.email !== "string" ||
      !("refreshToken" in parsed) ||
      typeof parsed.refreshToken !== "string"
    ) {
      return null;
    }
    return {
      adminId: parsed.adminId,
      email: parsed.email,
      refreshToken: parsed.refreshToken,
    };
  } catch (error) {
    console.error(
      "Could not decrypt the Gmail connection cookie:",
      error instanceof Error ? error.message : "Unknown decryption error",
    );
    return null;
  }
}

export async function getGmailConnection(adminId: number) {
  const store = await cookies();
  const value = store.get(connectionCookie)?.value;
  if (!value) return null;

  const connection = decryptConnection(value);
  if (!connection || connection.adminId !== adminId) return null;
  return connection;
}

export async function saveGmailConnection(connection: GmailConnection) {
  const store = await cookies();
  store.set(
    connectionCookie,
    encryptConnection(connection),
    cookieOptions(refreshTokenCookieMaxAge),
  );
}

export async function clearGmailConnection() {
  const store = await cookies();
  store.set(connectionCookie, "", cookieOptions(0));
}

export function gmailOAuthStateCookieOptions(maxAge: number) {
  return cookieOptions(maxAge);
}

async function readJson(response: Response) {
  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null) {
    throw new GmailProviderError("Google returned an invalid response.");
  }
  return result as Record<string, unknown>;
}

export async function createGmailDraft({
  connection,
  recipient,
  subject,
  plainText,
  html,
}: {
  connection: GmailConnection;
  recipient: string;
  subject: string;
  plainText: string;
  html: string;
}) {
  const config = getGmailOAuthConfig();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: connection.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const tokenResult = await readJson(tokenResponse);
  if (!tokenResponse.ok) {
    if (tokenResult.error === "invalid_grant") {
      throw new GmailReconnectRequiredError("Reconnect the Gmail account to continue.");
    }
    throw new GmailProviderError("Google could not refresh the Gmail access token.");
  }
  if (typeof tokenResult.access_token !== "string") {
    throw new GmailProviderError("Google did not return an access token.");
  }

  const boundary = `villa-corazon-${randomBytes(12).toString("hex")}`;
  const encodePart = (value: string) =>
    Buffer.from(value, "utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n") ?? "";
  const encodedSubject = Buffer.from(subject, "utf8").toString("base64");
  const message = [
    `To: ${recipient.replace(/[\r\n]/g, "")}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodePart(plainText),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodePart(html),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  const raw = Buffer.from(message, "utf8").toString("base64url");
  const draftResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: { raw } }),
      cache: "no-store",
    },
  );
  const draftResult = await readJson(draftResponse);
  if (!draftResponse.ok) {
    if (draftResponse.status === 401 || draftResponse.status === 403) {
      throw new GmailReconnectRequiredError("Reconnect the Gmail account to continue.");
    }
    throw new GmailProviderError("Gmail could not create the draft.");
  }
  const draftMessage = draftResult.message;
  if (
    typeof draftResult.id !== "string" ||
    typeof draftMessage !== "object" ||
    draftMessage === null ||
    !("id" in draftMessage) ||
    typeof draftMessage.id !== "string"
  ) {
    throw new GmailProviderError("Gmail did not return the draft message ID.");
  }
  return {
    messageId: draftMessage.id,
  };
}
