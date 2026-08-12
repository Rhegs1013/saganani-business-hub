"use client";

import { useTransition } from "react";
import { deleteLiability } from "./actions";

export function DeleteLiabilityButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deleteLiability(id))}
      className="font-bold text-lupang-sunog hover:underline disabled:opacity-50"
    >
      Remove
    </button>
  );
}
