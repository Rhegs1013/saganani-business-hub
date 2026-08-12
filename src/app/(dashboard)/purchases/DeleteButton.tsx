"use client";

import { useTransition } from "react";
import { deletePurchase } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Alisin ang record na ito?")) {
          startTransition(() => deletePurchase(id));
        }
      }}
      className="font-bold text-lupang-sunog hover:underline disabled:opacity-50"
    >
      Delete
    </button>
  );
}
