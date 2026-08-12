"use client";

import { useState, useTransition } from "react";
import { updateBeginningQty } from "./actions";
import { todayISO } from "@/lib/format";

export function BeginningQtyEditor({
  productId,
  beginningQty,
  beginningDate,
}: {
  productId: string;
  beginningQty: number;
  beginningDate: string;
}) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(beginningQty);
  const [date, setDate] = useState(beginningDate === "1900-01-01" ? todayISO() : beginningDate);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="tap-target rounded-lg border border-transparent px-2 py-1 text-left font-bold text-sibol-green hover:border-sibol-green/20 hover:bg-sibol-green/5"
        title="I-tap para i-edit ang Beginning Qty"
      >
        {beginningQty}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
      <input
        type="number"
        step="0.01"
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        className="tap-target w-24 rounded-lg border border-sibol-green/20 px-2 py-1.5 text-sm"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="tap-target rounded-lg border border-sibol-green/20 px-2 py-1.5 text-sm"
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateBeginningQty(productId, qty, date);
              setEditing(false);
            })
          }
          className="tap-target rounded-lg bg-butil-gold px-2.5 py-1.5 text-xs font-bold text-sibol-green disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="tap-target rounded-lg border border-sibol-green/20 px-2.5 py-1.5 text-xs font-bold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
