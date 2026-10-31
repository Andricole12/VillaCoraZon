"use client";

import { useState } from "react";

type Invoice = {
  referenceCode: string;
  invoiceDate: string;
  customerName: string;
  contactNumber: string;
  email: string;
  address: string;
  eventType: string;
  startAt: string;
  endAt: string;
  venue: string;
  guestCount: number;
  total: number;
  paid: number;
  balance: number;
  items: Array<{
    description: string;
    detail: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  paymentDetails: Array<{
    date: string;
    amount: number;
    method: string;
    reference: string;
  }>;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function buildEmailHtml(invoice: Invoice, greeting: string, note: string) {
  const items = invoice.items
    .map(
      (item) => `
        <tr>
          <td style="padding:14px 12px;border-bottom:1px solid #e8e8ed;color:#14243d;font-weight:600;">
            ${escapeHtml(item.description)}
            <div style="padding-top:4px;color:#777b86;font-size:12px;font-style:italic;">${escapeHtml(item.detail)}</div>
          </td>
          <td style="padding:14px 8px;border-bottom:1px solid #e8e8ed;text-align:center;color:#14243d;">${item.quantity}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #e8e8ed;text-align:right;color:#14243d;">${currency(item.unitPrice)}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #e8e8ed;text-align:right;color:#14243d;font-weight:600;">${currency(item.amount)}</td>
        </tr>`,
    )
    .join("");
  const payments = invoice.paymentDetails.length
    ? invoice.paymentDetails
        .map(
          (payment) =>
            `<tr><td style="padding:5px 0;color:#606b7c;">${escapeHtml(payment.date)} · ${escapeHtml(payment.method)}${payment.reference ? ` · Ref: ${escapeHtml(payment.reference)}` : ""}</td><td style="padding:5px 0;text-align:right;color:#14243d;font-weight:600;">${currency(payment.amount)}</td></tr>`,
        )
        .join("")
    : `<tr><td style="padding:5px 0;color:#606b7c;">No paid payment recorded</td><td style="padding:5px 0;text-align:right;color:#14243d;font-weight:600;">${currency(0)}</td></tr>`;

  return `
  <div style="margin:0;padding:28px 12px;background:#f3f4f7;font-family:Arial,Helvetica,sans-serif;color:#14243d;">
    <div style="max-width:720px;margin:0 auto;">
      <p style="margin:0 0 18px;color:#26344a;font-size:15px;line-height:1.7;">${escapeHtml(greeting).replace(/\n/g, "<br>")}</p>
      ${note ? `<p style="margin:0 0 20px;color:#536075;font-size:14px;line-height:1.7;">${escapeHtml(note).replace(/\n/g, "<br>")}</p>` : ""}
      <div style="overflow:hidden;border:1px solid #dfe2e9;border-radius:10px;background:#ffffff;">
        <div style="padding:26px 30px;background:#101f36;color:#ffffff;border-bottom:4px solid #c8a75e;">
          <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
            <td style="vertical-align:middle;">
              <div style="font-family:Georgia,serif;font-size:21px;letter-spacing:2px;color:#ffffff;">VILLA CORAZON</div>
              <div style="padding-top:5px;font-size:10px;letter-spacing:3px;color:#d4d8e1;">EVENTS PLACE</div>
            </td>
            <td style="text-align:right;vertical-align:middle;">
              <div style="font-family:Georgia,serif;font-size:27px;letter-spacing:2px;color:#e4c777;">INVOICE</div>
              <div style="padding-top:7px;font-size:12px;color:#e4e7ed;">${escapeHtml(invoice.referenceCode)}</div>
            </td>
          </tr></table>
        </div>
        <div style="padding:24px 30px 16px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
            <td style="width:50%;padding:0 18px 18px 0;vertical-align:top;">
              <div style="padding-bottom:9px;color:#7862a8;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Bill to</div>
              <div style="font-size:14px;font-weight:bold;color:#14243d;">${escapeHtml(invoice.customerName)}</div>
              <div style="padding-top:5px;color:#536075;font-size:12px;">${escapeHtml(invoice.contactNumber)}</div>
              ${invoice.email ? `<div style="padding-top:4px;color:#536075;font-size:12px;">${escapeHtml(invoice.email)}</div>` : ""}
              ${invoice.address ? `<div style="padding-top:4px;color:#536075;font-size:12px;">${escapeHtml(invoice.address)}</div>` : ""}
            </td>
            <td style="width:50%;padding:0 0 18px 18px;border-left:1px solid #e5e6eb;vertical-align:top;">
              <div style="padding-bottom:9px;color:#7862a8;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Event details</div>
              <table role="presentation" style="width:100%;border-collapse:collapse;font-size:12px;">
                <tr><td style="padding:3px 8px 3px 0;color:#737b89;">Event type</td><td style="padding:3px 0;color:#14243d;font-weight:600;">${escapeHtml(invoice.eventType)}</td></tr>
                <tr><td style="padding:3px 8px 3px 0;color:#737b89;">Event date</td><td style="padding:3px 0;color:#14243d;font-weight:600;">${escapeHtml(invoice.startAt)}</td></tr>
                <tr><td style="padding:3px 8px 3px 0;color:#737b89;">Venue</td><td style="padding:3px 0;color:#14243d;font-weight:600;">${escapeHtml(invoice.venue)}</td></tr>
                <tr><td style="padding:3px 8px 3px 0;color:#737b89;">Guests</td><td style="padding:3px 0;color:#14243d;font-weight:600;">${invoice.guestCount}</td></tr>
                <tr><td style="padding:3px 8px 3px 0;color:#737b89;">Invoice date</td><td style="padding:3px 0;color:#14243d;font-weight:600;">${escapeHtml(invoice.invoiceDate)}</td></tr>
              </table>
            </td>
          </tr></table>
        </div>
        <div style="padding:0 30px 20px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr style="background:#7862a8;color:#ffffff;">
              <th style="padding:11px 12px;text-align:left;font-size:10px;letter-spacing:1px;">DESCRIPTION</th>
              <th style="padding:11px 8px;text-align:center;font-size:10px;letter-spacing:1px;">QTY</th>
              <th style="padding:11px 12px;text-align:right;font-size:10px;letter-spacing:1px;">UNIT PRICE</th>
              <th style="padding:11px 12px;text-align:right;font-size:10px;letter-spacing:1px;">AMOUNT</th>
            </tr></thead>
            <tbody>${items || `<tr><td colspan="4" style="padding:14px;color:#687287;">Reservation package</td></tr>`}</tbody>
          </table>
          <table role="presentation" style="width:min(100%,360px);margin:14px 0 0 auto;border-collapse:collapse;font-size:12px;">
            <tr><td style="padding:6px;color:#606b7c;">Invoice total</td><td style="padding:6px;text-align:right;color:#14243d;font-weight:600;">${currency(invoice.total)}</td></tr>
            <tr><td style="padding:6px;color:#606b7c;">Paid to date</td><td style="padding:6px;text-align:right;color:#14243d;font-weight:600;">− ${currency(invoice.paid)}</td></tr>
            <tr style="background:#101f36;"><td style="padding:11px 9px;color:#ffffff;font-weight:bold;">BALANCE DUE</td><td style="padding:11px 9px;text-align:right;color:#e4c777;font-size:15px;font-weight:bold;">${currency(invoice.balance)}</td></tr>
          </table>
        </div>
        <div style="margin:0 30px;padding:17px 0;border-top:1px solid #e4e6eb;">
          <div style="padding-bottom:9px;color:#7862a8;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Payment details</div>
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:12px;">${payments}</table>
        </div>
        <div style="margin:0 30px;padding:17px 0;border-top:1px solid #e4e6eb;">
          <div style="padding-bottom:7px;color:#7862a8;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Important</div>
          <p style="margin:0;color:#606b7c;font-size:12px;line-height:1.7;">This invoice confirms the reservation details and payments recorded to date. Please contact Villa Corazon Events Place if any information needs to be corrected. Any remaining balance and payment arrangements should follow the terms agreed in your quotation.</p>
        </div>
        <div style="padding:20px 30px;background:#f5f4f8;border-top:1px solid #e4e6eb;">
          <p style="margin:0;color:#14243d;font-family:Georgia,serif;font-size:19px;font-style:italic;">Thank you!</p>
          <p style="margin:7px 0 0;color:#606b7c;font-size:11px;line-height:1.6;">We look forward to making your special day a memorable celebration.<br><strong style="color:#14243d;">Villa Corazon Events Place</strong></p>
        </div>
      </div>
    </div>
  </div>`;
}

function buildPlainEmail(invoice: Invoice, greeting: string, note: string) {
  const lines = [
    greeting,
    note,
    "",
    "VILLA CORAZON EVENTS PLACE — RESERVATION INVOICE",
    `Invoice / reservation reference: ${invoice.referenceCode}`,
    `Invoice date: ${invoice.invoiceDate}`,
    "",
    `Bill to: ${invoice.customerName}`,
    `Contact: ${invoice.contactNumber}`,
    invoice.email ? `Email: ${invoice.email}` : "",
    invoice.address ? `Address: ${invoice.address}` : "",
    "",
    "EVENT DETAILS",
    `Event: ${invoice.eventType}`,
    `Date and time: ${invoice.startAt} – ${invoice.endAt}`,
    `Venue: ${invoice.venue}`,
    `Guests: ${invoice.guestCount}`,
    "",
    "ITEMS",
    ...invoice.items.map(
      (item) =>
        `${item.description} (${item.quantity} × ${currency(item.unitPrice)}): ${currency(item.amount)}`,
    ),
    "",
    `Invoice total: ${currency(invoice.total)}`,
    `Paid to date: ${currency(invoice.paid)}`,
    `Balance due: ${currency(invoice.balance)}`,
    "",
    "PAYMENTS RECORDED",
    ...invoice.paymentDetails.map(
      (payment) =>
        `${payment.date} · ${payment.method}${payment.reference ? ` · Ref: ${payment.reference}` : ""}: ${currency(payment.amount)}`,
    ),
    "",
    "This invoice confirms the reservation details and payments recorded to date. Please contact Villa Corazon Events Place if any information needs to be corrected. Any remaining balance and payment arrangements should follow the terms agreed in your quotation.",
    "",
    "Thank you!",
    "Villa Corazon Events Place",
  ];
  return lines.filter((line, index) => line || (index > 0 && lines[index - 1])).join("\n");
}

export default function InvoiceEmailTools({ invoice }: { invoice: Invoice }) {
  const [recipient, setRecipient] = useState(invoice.email);
  const [subject, setSubject] = useState(
    `Reservation confirmation and invoice ${invoice.referenceCode} | Villa Corazon`,
  );
  const [greeting, setGreeting] = useState(`Dear ${invoice.customerName},`);
  const [note, setNote] = useState(
    "We are pleased to confirm your reservation. Please review the invoice details below and keep this email for your records.",
  );
  const [copyState, setCopyState] = useState("");

  const plainEmail = buildPlainEmail(invoice, greeting, note);
  const recipientValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim());
  const emailHref = recipientValid
    ? `mailto:${encodeURIComponent(recipient.trim()).replace(/%40/gi, "@")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainEmail)}`
    : "";

  async function copyEmailTemplate() {
    try {
      const html = buildEmailHtml(invoice, greeting, note);
      const plain = buildPlainEmail(invoice, greeting, note);

      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plain], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plain);
        setCopyState("Rich-text copying is not supported here. The plain-text email template was copied.");
        return;
      }

      setCopyState("Branded email template copied. Paste it into your email draft, then edit as needed.");
    } catch {
      setCopyState("Could not copy the email template. Use Print / Save invoice as PDF instead.");
    }
  }

  return (
    <>
      <section className="invoice-email-editor" aria-label="Editable email message">
        <div>
          <p className="eyebrow">EMAIL TEMPLATE</p>
          <h2>Personalize your message</h2>
        </div>
        <label className="form-field">
          <span>To</span>
          <input
            autoComplete="email"
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="customer@example.com"
            type="email"
            value={recipient}
          />
        </label>
        <label className="form-field">
          <span>Subject</span>
          <input maxLength={200} onChange={(event) => setSubject(event.target.value)} value={subject} />
        </label>
        <label className="form-field">
          <span>Greeting</span>
          <input maxLength={200} onChange={(event) => setGreeting(event.target.value)} value={greeting} />
        </label>
        <label className="form-field">
          <span>Message</span>
          <textarea maxLength={1000} onChange={(event) => setNote(event.target.value)} rows={3} value={note} />
        </label>
        <div className="invoice-email-actions">
          <button className="button button-navy" onClick={copyEmailTemplate} type="button">
            Copy branded email
          </button>
          {recipientValid ? (
            <a className="button button-outline" href={emailHref}>
              Open email draft
            </a>
          ) : null}
          <button className="button button-outline" onClick={() => window.print()} type="button">
            Print / save invoice as PDF
          </button>
        </div>
        {copyState ? <p className="invoice-copy-status" role="status">{copyState}</p> : null}
        <p className="invoice-email-hint">
          Copy the branded message, open the email draft, then paste into the
          email body. The email text and invoice layout are included; edit them
          before sending. You can also print the invoice or save it as a PDF.
        </p>
      </section>

      <article className="invoice-paper">
        <header className="invoice-paper-header">
          <div className="invoice-brand">
            <span className="invoice-brand-mark">VC</span>
            <span><strong>VILLA CORAZON</strong><small>EVENTS PLACE</small></span>
          </div>
          <div className="invoice-title">
            <h2>INVOICE</h2>
            <span>{invoice.referenceCode}</span>
          </div>
        </header>
        <div className="invoice-meta">
          <section>
            <h3>Bill to</h3>
            <strong>{invoice.customerName}</strong>
            <span>{invoice.contactNumber}</span>
            {invoice.email ? <span>{invoice.email}</span> : null}
            {invoice.address ? <span>{invoice.address}</span> : null}
          </section>
          <section>
            <h3>Event details</h3>
            <dl>
              <div><dt>Event type</dt><dd>{invoice.eventType}</dd></div>
              <div><dt>Event date</dt><dd>{invoice.startAt}</dd></div>
              <div><dt>Venue</dt><dd>{invoice.venue}</dd></div>
              <div><dt>Guest count</dt><dd>{invoice.guestCount}</dd></div>
              <div><dt>Invoice date</dt><dd>{invoice.invoiceDate}</dd></div>
            </dl>
          </section>
        </div>
        <div className="invoice-lines-wrap">
          <table className="invoice-lines">
            <thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead>
            <tbody>
              {invoice.items.length ? invoice.items.map((item, index) => (
                <tr key={`${item.description}-${index}`}>
                  <td><strong>{item.description}</strong><small>{item.detail}</small></td>
                  <td>{item.quantity}</td>
                  <td>{currency(item.unitPrice)}</td>
                  <td>{currency(item.amount)}</td>
                </tr>
              )) : <tr><td colSpan={4}>Reservation package</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="invoice-totals">
          <div><span>Invoice total</span><strong>{currency(invoice.total)}</strong></div>
          <div><span>Paid to date</span><strong>− {currency(invoice.paid)}</strong></div>
          <div className="invoice-balance"><span>Balance due</span><strong>{currency(invoice.balance)}</strong></div>
        </div>
        <div className="invoice-bottom-grid">
          <section>
            <h3>Payment details</h3>
            {invoice.paymentDetails.length ? invoice.paymentDetails.map((payment, index) => (
              <p key={`${payment.date}-${index}`}>
                {payment.date} · {payment.method}: {currency(payment.amount)}
                {payment.reference ? <small>Reference: {payment.reference}</small> : null}
              </p>
            )) : <p>No paid payment recorded.</p>}
          </section>
          <section>
            <h3>Notes</h3>
            <p>This invoice confirms the reservation details and payments recorded to date.</p>
            <p>Please contact Villa Corazon Events Place if any information needs correction.</p>
            <p>Any remaining balance and payment arrangements should follow the terms agreed in your quotation.</p>
          </section>
        </div>
        <footer className="invoice-paper-footer">
          <div><strong>Thank you!</strong><span>We look forward to making your special day memorable.</span></div>
          <div><span>Authorized signature</span><strong>Villa Corazon Events Place</strong></div>
        </footer>
      </article>
    </>
  );
}
