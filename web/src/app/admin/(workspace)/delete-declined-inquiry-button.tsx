"use client";

import { deleteDeclinedInquiry } from "../actions";

export function DeleteDeclinedInquiryButton({
  inquiryId,
}: {
  inquiryId: number;
}) {
  return (
    <form
      action={deleteDeclinedInquiry}
      onSubmit={(event) => {
        if (!window.confirm("Permanently delete this declined inquiry?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <button className="button inquiry-delete-button" type="submit">
        Delete declined inquiry
      </button>
    </form>
  );
}
