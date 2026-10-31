"use client";

import { useState } from "react";

export default function GmailQuotationDraftButton({
  inquiryId,
  connectedEmail,
  oauthConfigured,
}: {
  inquiryId: number;
  connectedEmail: string | null;
  oauthConfigured: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [account, setAccount] = useState(connectedEmail);

  async function createDraft() {
    setBusy(true);
    setMessage("");
    const draftTab = window.open("about:blank", "_blank");

    try {
      const response = await fetch("/api/admin/gmail/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId }),
      });
      const result: unknown = await response.json();
      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("draftUrl" in result) ||
        typeof result.draftUrl !== "string" ||
        !result.draftUrl.startsWith("https://mail.google.com/")
      ) {
        if (draftTab && !draftTab.closed) draftTab.close();
        const errorMessage =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
            ? result.message
            : "Could not create the Gmail draft. Try again.";
        if (
          typeof result === "object" &&
          result !== null &&
          "code" in result &&
          (result.code === "connect_required" || result.code === "reconnect_required")
        ) {
          setAccount(null);
          setMessage("Reconnect Gmail to create this branded draft.");
          return;
        }
        setMessage(errorMessage);
        return;
      }

      if (draftTab) {
        draftTab.location.replace(result.draftUrl);
      } else {
        window.location.assign(result.draftUrl);
      }
    } catch {
      if (draftTab && !draftTab.closed) draftTab.close();
      setMessage("Could not reach the website or Gmail. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="quotation-email-actions">
      {account ? (
        <>
          <button
            className="button button-navy"
            disabled={busy}
            onClick={createDraft}
            type="button"
          >
            {busy ? "Creating Gmail draft..." : "Create & open branded draft"}
            {!busy ? <span aria-hidden="true">↗</span> : null}
          </button>
          <span className="quotation-gmail-account">Gmail: {account}</span>
          <a className="quotation-gmail-switch" href="/api/admin/gmail/connect">
            Switch Gmail account
          </a>
        </>
      ) : oauthConfigured ? (
        <a className="button button-navy" href="/api/admin/gmail/connect">
          Connect Gmail to create draft <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <p className="quotation-email-hint">
          Configure Gmail OAuth in <code>web/.env.local</code> to create formatted drafts.
          See the Gmail setup guide in the README.
        </p>
      )}
      {message ? <p className="quotation-email-status" role="alert">{message}</p> : null}
      <p className="quotation-email-hint">
        The saved quotation opens in Gmail as a formatted, editable draft. It is not sent automatically.
      </p>
    </div>
  );
}
