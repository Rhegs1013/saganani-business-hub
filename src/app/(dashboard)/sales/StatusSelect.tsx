"use client";

import { useTransition } from "react";
import { ORDER_STATUSES } from "@/lib/constants";
import { updateSaleStatus } from "./actions";

export function StatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(() => updateSaleStatus(id, e.target.value))}
      className="tap-target rounded-lg border border-sibol-green/20 bg-white px-2 py-1.5 text-xs font-bold text-sibol-green outline-none focus:border-butil-gold disabled:opacity-50"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
