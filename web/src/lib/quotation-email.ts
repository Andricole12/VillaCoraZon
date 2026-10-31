export type QuotationEmailDetails = {
  customerName: string;
  eventType: string;
  eventDate: string;
  venue: string;
  packageName: string;
  guestCount: number;
  amount: string;
  validUntil: string;
  notes: string;
};

export function quotationEmailSubject(details: QuotationEmailDetails) {
  return `Your Villa Corazon quotation for ${details.eventType}`;
}

export function buildQuotationEmailText(details: QuotationEmailDetails) {
  return [
    `Dear ${details.customerName},`,
    "",
    `Thank you for considering Villa Corazon Events Place for your ${details.eventType}. We are pleased to share the quotation for your requested event.`,
    "",
    "QUOTATION SUMMARY",
    `Event: ${details.eventType}`,
    `Preferred date: ${details.eventDate}`,
    `Venue: ${details.venue}`,
    `Package: ${details.packageName}`,
    `Guest count: ${details.guestCount}`,
    `Quotation total: ${details.amount}`,
    `Valid until: ${details.validUntil}`,
    details.notes ? `\nQuotation details:\n${details.notes}` : "",
    "",
    "Please reply to this email or contact our team if you would like to accept the quotation or have any questions.",
    "",
    "Please note: This quotation is not a reservation or date hold. Your date is confirmed only after you accept the quotation, the deposit is verified, and our team confirms your reservation.",
    "",
    "We look forward to celebrating with you.",
    "Villa Corazon Events Place",
  ]
    .filter(Boolean)
    .join("\n");
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

export function buildQuotationEmailHtml(details: QuotationEmailDetails) {
  const rows = [
    ["Event", details.eventType],
    ["Preferred date", details.eventDate],
    ["Venue", details.venue],
    ["Package", details.packageName],
    ["Guest count", String(details.guestCount)],
    ["Quotation valid until", details.validUntil],
  ]
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e8eaf0;color:#697487;font-size:13px;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e8eaf0;color:#14243d;font-size:13px;font-weight:600;text-align:right;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  return `
  <div style="margin:0;padding:28px 12px;background:#f3f4f7;font-family:Arial,Helvetica,sans-serif;color:#14243d;">
    <div style="max-width:640px;margin:0 auto;">
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">Dear ${escapeHtml(details.customerName)},</p>
      <div style="overflow:hidden;border:1px solid #dfe2e9;border-radius:10px;background:#ffffff;">
        <div style="padding:25px 28px;background:#101f36;color:#ffffff;border-bottom:4px solid #c8a75e;">
          <div style="font-family:Georgia,serif;font-size:21px;letter-spacing:2px;">VILLA CORAZON</div>
          <div style="padding-top:5px;color:#d4d8e1;font-size:10px;letter-spacing:3px;">EVENTS PLACE</div>
          <div style="padding-top:22px;color:#e4c777;font-family:Georgia,serif;font-size:23px;">Your event quotation</div>
        </div>
        <div style="padding:25px 28px;">
          <p style="margin:0 0 18px;color:#536075;font-size:14px;line-height:1.7;">Thank you for considering Villa Corazon Events Place for your ${escapeHtml(details.eventType)}. We are pleased to share the quotation for your requested event.</p>
          <div style="margin-bottom:18px;padding:17px 19px;border-left:4px solid #c8a75e;border-radius:4px;background:#f5f4f8;">
            <div style="color:#7862a8;font-size:10px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;">Quotation total</div>
            <div style="padding-top:7px;color:#101f36;font-family:Georgia,serif;font-size:27px;">${escapeHtml(details.amount)}</div>
          </div>
          <table role="presentation" style="width:100%;border-collapse:collapse;">${rows}</table>
          ${details.notes ? `<div style="margin-top:19px;padding:15px 16px;border-radius:6px;background:#f5f4f8;"><div style="padding-bottom:7px;color:#7862a8;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Quotation details</div><div style="color:#536075;font-size:13px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(details.notes).replace(/\n/g, "<br>")}</div></div>` : ""}
          <p style="margin:20px 0 0;color:#536075;font-size:13px;line-height:1.7;">Please reply to this email or contact our team if you would like to accept the quotation or have any questions.</p>
          <p style="margin:13px 0 0;padding:13px 15px;border-radius:5px;background:#fff8e8;color:#765d2b;font-size:12px;line-height:1.7;"><strong>Please note:</strong> This quotation is not a reservation or date hold. Your date is confirmed only after you accept the quotation, the deposit is verified, and our team confirms your reservation.</p>
        </div>
        <div style="padding:18px 28px;background:#f5f4f8;border-top:1px solid #e4e6eb;">
          <p style="margin:0;color:#14243d;font-family:Georgia,serif;font-size:17px;font-style:italic;">We look forward to celebrating with you.</p>
          <p style="margin:7px 0 0;color:#606b7c;font-size:11px;line-height:1.6;"><strong style="color:#14243d;">Villa Corazon Events Place</strong></p>
        </div>
      </div>
    </div>
  </div>`;
}
