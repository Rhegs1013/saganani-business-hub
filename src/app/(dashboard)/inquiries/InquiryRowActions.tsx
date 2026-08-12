"use client";

import { useTransition } from "react";
import { INQUIRY_STATUSES } from "@/lib/constants";
import { deleteInquiry, updateInquiryStatus } from "./actions";

export function StatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(() => updateInquiryStatus(id, e.target.value))}
      className="tap-target rounded-lg border border-sibol-green/20 bg-white px-2 py-1.5 text-xs font-bold text-sibol-green outline-none focus:border-butil-gold disabled:opacity-50"
    >
      {INQUIRY_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Alisin ang tanong na ito?")) {
          startTransition(() => deleteInquiry(id));
        }
      }}
      className="font-bold text-lupang-sunog hover:underline disabled:opacity-50"
    >
      Delete
    </button>
  );
}
